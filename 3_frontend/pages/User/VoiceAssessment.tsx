import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../../components/layout/UserLayout";
import { Mic, Square, Pause, Trash2, Send, AlertCircle, Volume2, Globe, Edit3, Sparkles, Check, Play } from "lucide-react";
import { performAiAssessment } from "../../utils/aiEngine";
import { saveAssessment } from "../../utils/assessmentStore";
import { api } from "../../utils/api";

const STEPS = [
  "Speech transcription & normalization",
  "Language & dialect detection",
  "Sentiment & distress extraction",
  "Speech-pattern & urgency analysis",
  "Vulnerability factor modeling",
  "SVI score generation",
];

const SAMPLE_PROMPTS = [
  {
    label: "Threat & Safety",
    text: "I am afraid to return home and I do not know what I should do next. People in my village are threatening my family and I cannot sleep at night. I feel very unsafe and isolated.",
  },
  {
    label: "Discrimination",
    text: "Our family has been facing continuous caste-based harassment and social boycott. We have been denied access to common village amenities.",
  },
  {
    label: "Assault & Medical",
    text: "I was physically attacked yesterday near the market. I have injuries and need immediate medical and protective help. I am terrified.",
  },
  {
    label: "Legal Distress",
    text: "I am facing false legal accusations. I do not have money for a lawyer. I am feeling completely lost, anxious, and helpless.",
  },
];

const LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "हिंदी (Hindi)" },
  { code: "mr-IN", name: "मराठी (Marathi)" },
  { code: "en-US", name: "English (US)" },
];

export default function VoiceAssessment() {
  const nav = useNavigate();
  type PageState = "ready" | "listening" | "paused" | "processing";
  const [state, setState] = useState<PageState>("ready");
  const [seconds, setSeconds] = useState(0);
  const [procStep, setProcStep] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [selectedLang, setSelectedLang] = useState("en-IN");
  const [isEditing, setIsEditing] = useState(false);
  const [micVolume, setMicVolume] = useState<number[]>(new Array(16).fill(12));
  const [micStatus, setMicStatus] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (state === "listening") {
      t = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [state]);

  useEffect(() => {
    return () => {
      stopAllCapture();
    };
  }, []);

  function stopAllCapture() {
    listeningRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setInterimText("");
    setMicVolume(new Array(16).fill(12));
  }

  function startCapture() {
    setMicStatus("");
    listeningRef.current = true;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setMicStatus("⚠️ Speech recognition not supported. Use the text editor or sample prompts below.");
    } else {
      try {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }

        const rec = new SpeechRecognitionAPI();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = selectedLang;

        rec.onstart = () => {
          setMicStatus("🎙️ Listening — speak now...");
        };

        rec.onresult = (event: SpeechRecognitionEvent) => {
          let finalStr = "";
          let interimStr = "";

          for (let i = 0; i < event.results.length; i++) {
            const r = event.results[i];
            if (r.isFinal) {
              finalStr += r[0].transcript + " ";
            } else {
              interimStr += r[0].transcript;
            }
          }

          if (finalStr.trim()) {
            setTranscript(finalStr.trim());
            setMicStatus("🎙️ Transcribing your voice...");
          }
          setInterimText(interimStr);
        };

        rec.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn("Speech recognition error:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setMicStatus("❌ Microphone blocked! Allow mic access in browser, or type manually below.");
          } else if (event.error === "no-speech") {
            setMicStatus("🔇 No speech heard. Speak louder or closer to the mic.");
          } else if (event.error === "network") {
            setMicStatus("❌ Network error — speech API needs internet. Use text input instead.");
          } else if (event.error === "aborted") {
            // intentional
          } else {
            setMicStatus(`⚠️ Speech error: ${event.error}`);
          }
        };

        rec.onend = () => {
          if (listeningRef.current && recognitionRef.current === rec) {
            try {
              rec.start();
            } catch {
              setMicStatus("Speech recognition stopped. Click Start to try again.");
            }
          }
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err: any) {
        console.error("Speech start failed:", err);
        setMicStatus("❌ Speech recognition failed: " + (err?.message || "unknown error"));
      }
    }

    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          if (!listeningRef.current) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          mediaStreamRef.current = stream;
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const src = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateVis = () => {
              if (!listeningRef.current) return;
              analyserRef.current?.getByteFrequencyData(dataArray);
              const bars: number[] = [];
              for (let i = 0; i < 16; i++) {
                const val = dataArray[i * 2] || 0;
                bars.push(Math.max(8, Math.min(48, Math.round((val / 255) * 44) + 6)));
              }
              setMicVolume(bars);
              animFrameRef.current = requestAnimationFrame(updateVis);
            };
            updateVis();
          }
        })
        .catch(() => {
          const pulse = setInterval(() => {
            if (!listeningRef.current) { clearInterval(pulse); return; }
            setMicVolume(new Array(16).fill(0).map(() => Math.floor(Math.random() * 26) + 10));
          }, 120);
        });
    }
  }

  function handleStart() {
    setState("listening");
    setSeconds(0);
    startCapture();
  }

  function handlePause() {
    setState("paused");
    stopAllCapture();
  }

  function handleResume() {
    setState("listening");
    startCapture();
  }

  function handleReset() {
    stopAllCapture();
    setState("ready");
    setSeconds(0);
    setTranscript("");
    setInterimText("");
    setIsEditing(false);
    setMicStatus("");
  }

  async function handleSubmit() {
    const finalContent = (transcript + (interimText ? " " + interimText : "")).trim();
    if (!finalContent) {
      setMicStatus("⚠️ No content to assess. Speak or type something first.");
      return;
    }

    stopAllCapture();
    setState("processing");

    const langObj = LANGUAGES.find(l => l.code === selectedLang);
    const durationVal = seconds || 18;
    const langName = langObj?.name || "English";

    let result;
    const res = await api.post<any>("/assessment", {
      text: finalContent,
      duration: durationVal,
      lang: langName
    });

    if (res.ok && res.data) {
      result = {
        ...res.data.assessment,
        id: res.data.caseId,
        transcript: finalContent,
        date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + ", " + new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      };
    } else {
      console.warn("Backend AI assessment failed, falling back to local parser:", res.error);
      result = performAiAssessment(finalContent, durationVal, langName);
    }

    saveAssessment(result);

    let step = 0;
    const t = setInterval(() => {
      step++;
      setProcStep(step);
      if (step >= STEPS.length) {
        clearInterval(t);
        setTimeout(() => nav("/assessment-result"), 500);
      }
    }, 600);
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-navy-900 flex items-center gap-2">
              Talk to RAAHAT
              <span className="text-xs bg-navy-100 text-navy-800 font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles size={11} /> Voice AI
              </span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Speak at your own pace. There is no rush.</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3 py-1.5 rounded text-xs text-slate-600 shadow-sm">
            <Globe size={14} className="text-navy-700" />
            <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} className="bg-transparent font-medium text-navy-900 outline-none cursor-pointer">
              {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>

        {/* Recording Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 mb-5 text-center shadow-xs">
          {state === "processing" ? (
            <div className="py-4">
              <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-12 h-12 border-4 border-navy-900 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="font-bold text-navy-900 text-lg mb-1">AI Assessment in Progress</h2>
              <p className="text-xs text-slate-500 mb-6">Analyzing your input for vulnerability indicators</p>
              <div className="space-y-2.5 text-left max-w-sm mx-auto bg-slate-50 p-4 rounded-lg border border-slate-100">
                {STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                    i < procStep ? "text-safe-700 font-medium" : i === procStep ? "text-navy-900 font-bold" : "text-slate-400"
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      i < procStep ? "bg-safe-700 text-white" : i === procStep ? "bg-navy-900 text-white animate-pulse" : "bg-slate-200 text-slate-400"
                    }`}>
                      {i < procStep ? <Check size={12} /> : i + 1}
                    </div>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <div className="relative inline-flex items-center justify-center my-2">
                  {state === "listening" && (
                    <>
                      <span className="absolute w-36 h-36 rounded-full bg-red-400 opacity-20 animate-ping" />
                      <span className="absolute w-32 h-32 rounded-full bg-red-500 opacity-25 animate-pulse" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      if (state === "ready") handleStart();
                      else if (state === "listening") handlePause();
                      else if (state === "paused") handleResume();
                    }}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white transition-all shadow-md active:scale-95 ${
                      state === "listening" ? "bg-red-600 hover:bg-red-700 ring-4 ring-red-100"
                      : state === "paused" ? "bg-amber-600 hover:bg-amber-700 ring-4 ring-amber-100"
                      : "bg-navy-900 hover:bg-navy-800 ring-4 ring-navy-100"
                    }`}
                  >
                    {state === "listening" ? <Pause size={32} /> : <Mic size={32} />}
                  </button>
                </div>

                {state === "listening" && (
                  <div className="flex items-center justify-center gap-1.5 h-12 my-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full">
                    <Volume2 size={16} className="text-red-600 animate-pulse mr-1" />
                    {micVolume.map((height, i) => (
                      <span key={i} style={{ height: `${height}px` }} className="w-1 bg-red-500 rounded-full transition-all duration-75" />
                    ))}
                  </div>
                )}

                <div className="mt-2">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                    {state === "ready" && "Click microphone to start"}
                    {state === "listening" && (
                      <span className="text-red-600 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> Listening…
                      </span>
                    )}
                    {state === "paused" && <span className="text-amber-700">Paused</span>}
                  </div>
                  {(state === "listening" || state === "paused") && (
                    <div className="font-mono text-2xl font-bold text-navy-900">{fmt(seconds)}</div>
                  )}
                </div>

                {micStatus && (
                  <div className={`mt-4 p-3 rounded text-xs max-w-md mx-auto text-left flex items-start gap-2 ${
                    micStatus.startsWith("❌") ? "bg-red-50 border border-red-200 text-red-700"
                    : micStatus.startsWith("⚠️") ? "bg-amber-50 border border-amber-200 text-amber-700"
                    : micStatus.startsWith("🔇") ? "bg-slate-100 border border-slate-200 text-slate-600"
                    : "bg-green-50 border border-green-200 text-green-700"
                  }`}>
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{micStatus}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  {state === "ready" ? (
                    <button onClick={handleStart} className="flex items-center gap-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 px-6 py-2.5 rounded shadow-sm transition-all cursor-pointer">
                      <Mic size={16} /> Start Recording
                    </button>
                  ) : (
                    <>
                      <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-red-600 border border-slate-200 px-3.5 py-2 rounded font-medium transition-all cursor-pointer">
                        <Trash2 size={16} /> Reset
                      </button>
                      <button onClick={() => state === "listening" ? handlePause() : handleResume()} className="flex items-center gap-1.5 text-sm text-slate-700 border border-slate-200 px-3.5 py-2 rounded font-medium transition-all cursor-pointer">
                        {state === "listening" ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume</>}
                      </button>
                      {(transcript || interimText) && (
                        <button onClick={handleSubmit} className="flex items-center gap-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 px-5 py-2 rounded shadow-sm transition-all cursor-pointer">
                          <Send size={15} /> Submit for Assessment
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Transcription Panel */}
        {state !== "processing" && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${state === "listening" ? "bg-red-500 animate-ping" : transcript ? "bg-safe-600" : "bg-slate-300"}`} />
                <span className="text-xs font-bold text-navy-800 uppercase tracking-widest">
                  {state === "listening" ? "Live Transcription" : "Transcribed Text"}
                </span>
              </div>
              <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-navy-700 hover:text-navy-900 font-semibold flex items-center gap-1 hover:underline cursor-pointer">
                <Edit3 size={13} /> {isEditing ? "Done" : "Edit / Type"}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Type or paste what happened in your own words..."
                  rows={4}
                  className="w-full text-sm p-3 border border-navy-300 rounded focus:outline-none focus:ring-1 focus:ring-navy-600 leading-relaxed text-slate-800"
                />
                <div className="flex justify-end">
                  <button onClick={() => setIsEditing(false)} className="text-xs px-3 py-1 bg-navy-900 text-white rounded font-medium cursor-pointer">
                    Done Editing
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-navy-50/70 rounded-lg p-4 border border-navy-100 min-h-[70px]">
                {transcript || interimText ? (
                  <p className="text-sm text-navy-950 leading-relaxed">
                    {transcript}
                    {interimText && <span className="text-navy-500 italic opacity-80"> {interimText}</span>}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    {state === "listening"
                      ? "Speak now… your voice will appear here in real-time."
                      : "Click Start Recording above, or type/paste text using the Edit button, or load a test scenario below."}
                  </p>
                )}
              </div>
            )}

            {transcript && (
              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <span>Language: {LANGUAGES.find(l => l.code === selectedLang)?.name}</span>
                <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
              </div>
            )}
          </div>
        )}

        {/* Quick Test Scenarios */}
        {state !== "processing" && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-navy-700" />
              <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">Quick Test Scenarios (Click to Load)</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {SAMPLE_PROMPTS.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => { setTranscript(sp.text); if (state === "ready") setSeconds(15); }}
                  className="text-left p-3 bg-white border border-slate-200 hover:border-navy-400 rounded transition-all group cursor-pointer"
                >
                  <div className="text-xs font-bold text-navy-900 mb-1 flex items-center justify-between">
                    <span>{sp.label}</span>
                    <span className="text-[10px] text-navy-600 bg-navy-50 px-1.5 py-0.5 rounded font-mono">Load</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{sp.text}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {state === "ready" && transcript && (
          <div className="mb-5 flex justify-center">
            <button onClick={handleSubmit} className="flex items-center gap-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 px-6 py-2.5 rounded shadow-sm transition-all cursor-pointer">
              <Send size={16} /> Submit Text for Assessment
            </button>
          </div>
        )}

        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-600">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-slate-400" />
          <span>Your voice is processed securely and used only for AI-assisted vulnerability assessment. For emergencies: <strong className="font-mono">112</strong> / <strong className="font-mono">14566</strong>.</span>
        </div>
      </div>
    </UserLayout>
  );
}
