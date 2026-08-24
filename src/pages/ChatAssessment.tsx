import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { Send, Mic, Globe, AlertCircle, MicOff, Sparkles } from "lucide-react";
import { performAiAssessment } from "../utils/aiEngine";
import { saveAssessment } from "../utils/assessmentStore";

type Msg = { role: "ai" | "user"; text: string; time: string };

const INIT: Msg[] = [
  {
    role: "ai",
    text: "Namaste. I am RAAHAT, here to assist you. This is a safe and confidential space. You may share as much or as little as you feel comfortable. I will guide you gently.\n\nCould you please begin by telling me what has brought you here today?",
    time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  },
];

function getLangCode(lang: string): string {
  switch (lang) {
    case "हिंदी": return "hi-IN";
    case "मराठी": return "mr-IN";
    default: return "en-IN";
  }
}

export default function ChatAssessment() {
  const nav = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(INIT);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [turn, setTurn] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [micStatus, setMicStatus] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState("English");
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setMicStatus("");
  }, []);

  const startListening = useCallback(() => {
    // First stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setMicStatus("⚠️ Speech recognition not supported in this browser. Please type your message instead.");
      return;
    }

    try {
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = getLangCode(selectedLang);

      rec.onstart = () => {
        setIsListening(true);
        setMicStatus("🎙️ Listening... Speak now.");
      };

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + " ";
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combined = (finalTranscript + interimTranscript).trim();
        if (combined) {
          setInput(combined);
          setMicStatus("🎙️ Hearing you: " + combined.substring(0, 50) + (combined.length > 50 ? "..." : ""));
        }
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicStatus("❌ Microphone permission denied. Please allow microphone access in your browser settings.");
          setIsListening(false);
        } else if (event.error === "no-speech") {
          setMicStatus("🔇 No speech detected. Try speaking louder or closer to the mic.");
        } else if (event.error === "network") {
          setMicStatus("❌ Network error. Speech recognition needs internet. Please type your message instead.");
          setIsListening(false);
        } else if (event.error === "aborted") {
          // Intentional stop, do nothing
        } else {
          setMicStatus(`⚠️ Error: ${event.error}. Try again or type your message.`);
        }
      };

      rec.onend = () => {
        // If we're still supposed to be listening (user didn't stop), restart
        // Use ref to avoid stale closure
        if (recognitionRef.current === rec) {
          try {
            rec.start();
          } catch {
            setIsListening(false);
            setMicStatus("");
          }
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error("Failed to start speech recognition:", err);
      setMicStatus("❌ Could not start speech recognition: " + (err?.message || "Unknown error"));
      setIsListening(false);
    }
  }, [selectedLang]);

  function toggleSpeechToText() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function getNow(): string {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  }

  async function send() {
    if (!input.trim()) return;

    // Stop listening if active
    stopListening();

    const userText = input.trim();
    const userMsg: Msg = { role: "user", text: userText, time: getNow() };

    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const nextTurn = turn + 1;
    setTurn(nextTurn);

    // Simulate short AI thinking delay
    setTimeout(() => {
      setTyping(false);

      // Collect all user text for holistic assessment
      const allUserTexts = [...messages.filter(m => m.role === "user").map(m => m.text), userText].join(". ");
      const dynamicAssessment = performAiAssessment(allUserTexts, nextTurn * 10, selectedLang);
      saveAssessment(dynamicAssessment);

      // Generate contextual AI reply based on content
      let aiReply = "";
      const lower = userText.toLowerCase();

      if (lower.includes("threat") || lower.includes("fear") || lower.includes("unsafe") || lower.includes("kill") || lower.includes("attack") || lower.includes("dhamki") || lower.includes("dar")) {
        aiReply = `I understand how distressing this is. Your safety is our top priority.\n\nBased on what you've shared, I've assessed your vulnerability level as ${dynamicAssessment.priority} (SVI: ${dynamicAssessment.svi}/100).\n\nAre you currently in a safe place, or do you need urgent protective assistance?`;
      } else if (lower.includes("police") || lower.includes("court") || lower.includes("fir") || lower.includes("lawyer") || lower.includes("kanoon")) {
        aiReply = `Thank you for explaining the legal challenges you're facing. Navigating legal processes under duress is difficult.\n\nI've noted your case as ${dynamicAssessment.priority} priority (SVI: ${dynamicAssessment.svi}/100). RAAHAT can connect you with authorized legal aid officers in your district.`;
      } else if (lower.includes("sad") || lower.includes("cry") || lower.includes("sleep") || lower.includes("alone") || lower.includes("anxious") || lower.includes("depressed") || lower.includes("hopeless")) {
        aiReply = `I hear you, and I want you to know that your feelings are valid. The emotional burden you're carrying is significant.\n\nYour vulnerability assessment shows ${dynamicAssessment.priority} priority (SVI: ${dynamicAssessment.svi}/100). Counselling and psychological support services are available.`;
      } else if (lower.includes("caste") || lower.includes("discrimination") || lower.includes("boycott") || lower.includes("dalit") || lower.includes("bhedbhav")) {
        aiReply = `What you've described is deeply concerning and constitutes a serious violation of your fundamental rights.\n\nYour case has been assessed at ${dynamicAssessment.priority} priority (SVI: ${dynamicAssessment.svi}/100). Legal protection and community support measures are recommended.`;
      } else if (nextTurn === 1) {
        aiReply = `Thank you for sharing that. I understand this may be difficult.\n\nBased on your initial description, I've generated a preliminary assessment (SVI: ${dynamicAssessment.svi}/100, ${dynamicAssessment.priority} priority).\n\nCan you tell me — are you currently safe, and is there anyone nearby who can support you?`;
      } else if (nextTurn === 2) {
        aiReply = `I understand. Your updated vulnerability assessment is now SVI: ${dynamicAssessment.svi}/100 (${dynamicAssessment.priority} priority).\n\nOn a scale of 1 to 5, how urgent is the help you need right now? This will help me tailor the right support.`;
      } else {
        aiReply = `Thank you for sharing all of this. I have now completed a comprehensive vulnerability assessment based on everything you've told me.\n\n📊 Your SVI Score: ${dynamicAssessment.svi}/100\n🔴 Priority: ${dynamicAssessment.priority}\n\nI'm now generating your detailed recommendations and case summary. You'll be redirected shortly.`;
      }

      setMessages(m => [...m, {
        role: "ai",
        text: aiReply,
        time: getNow(),
      }]);

      // Navigate to results after enough conversation or urgent content
      if (nextTurn >= 3 || lower.includes("emergency") || lower.includes("unsafe") || lower.includes("immediate")) {
        setTimeout(() => {
          nav("/assessment-result");
        }, 2500);
      }
    }, 1200);
  }

  return (
    <UserLayout>
      <div className="flex flex-col h-[calc(100vh-52px)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-navy-900 flex items-center gap-2">
                RAAHAT Support Assistant
                <span className="text-[10px] bg-navy-100 text-navy-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles size={10} /> Real-Time
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Share only what you are comfortable sharing. This conversation is confidential.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe size={14} />
              <select
                value={selectedLang}
                onChange={e => {
                  setSelectedLang(e.target.value);
                  if (isListening) {
                    stopListening();
                    setTimeout(() => startListening(), 200);
                  }
                }}
                className="text-xs font-medium text-navy-900 bg-transparent border border-slate-200 rounded px-2 py-1 outline-none"
              >
                {["English", "हिंदी", "मराठी"].map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-7 h-7 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2 mt-0.5 shrink-0">R</div>
              )}
              <div className="max-w-[80%]">
                <div className={`rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.role === "ai" ? "bg-white border border-slate-200 text-slate-800" : "bg-navy-900 text-white"
                }`}>
                  {msg.text}
                </div>
                <div className={`text-[10px] text-slate-400 mt-1 ${msg.role === "user" ? "text-right" : ""}`}>{msg.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">R</div>
              <div className="bg-white border border-slate-200 rounded px-4 py-3 flex items-center gap-1 shadow-xs">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Mic Status Bar */}
        {micStatus && (
          <div className={`px-6 py-2 text-xs font-medium border-t ${
            micStatus.startsWith("❌") ? "bg-red-50 text-red-700 border-red-200" :
            micStatus.startsWith("⚠️") ? "bg-amber-50 text-amber-700 border-amber-200" :
            micStatus.startsWith("🔇") ? "bg-slate-100 text-slate-600 border-slate-200" :
            "bg-green-50 text-green-700 border-green-200"
          }`}>
            {micStatus}
          </div>
        )}

        {/* Input */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSpeechToText}
              className={`p-2.5 rounded-full border transition-all ${
                isListening
                  ? "bg-red-500 text-white border-red-600 shadow-md"
                  : "text-slate-500 hover:text-navy-900 border-slate-200 hover:border-navy-400 hover:bg-navy-50"
              }`}
              title={isListening ? "Click to stop listening" : "Click to speak with voice"}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="flex-1 border border-slate-300 rounded px-4 py-2.5 text-sm outline-none focus:border-navy-600 focus:ring-1 focus:ring-navy-200 transition-all"
              placeholder={isListening ? "🎙️ Listening... speak now (or type here)" : "Type your message or click 🎙️ to speak…"}
            />
            <button
              onClick={send}
              disabled={!input.trim()}
              className="w-10 h-10 bg-navy-900 text-white rounded flex items-center justify-center hover:bg-navy-800 disabled:opacity-40 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <AlertCircle size={11} />
              <span>Your responses are encrypted. For emergencies, call <strong className="font-mono text-slate-600">112</strong> or <strong className="font-mono text-slate-600">14566</strong>.</span>
            </div>
            {isListening && <span className="text-red-500 font-bold animate-pulse">● REC</span>}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
