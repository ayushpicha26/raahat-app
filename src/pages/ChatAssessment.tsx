import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { Send, Mic, Globe, AlertCircle } from "lucide-react";

type Msg = { role: "ai" | "user"; text: string; time: string };

const INIT: Msg[] = [
  {
    role: "ai",
    text: "Namaste. I am RAAHAT, here to assist you. This is a safe and confidential space. You may share as much or as little as you feel comfortable. I will guide you gently.\n\nCould you please begin by telling me what has brought you here today?",
    time: "10:32 AM"
  }
];

const AI_RESPONSES: Record<number, string> = {
  1: "Thank you for sharing that. I understand this situation may be difficult to describe. You can continue when you are ready.\n\nAre you currently in a safe place?",
  2: "I hear you. Your safety is the most important concern right now.\n\nOn a scale from 1 to 5, how would you describe your current level of fear or anxiety? (1 = very low, 5 = very high)",
  3: "Thank you for telling me. Is there someone you trust — a family member, neighbour, or community member — who is aware of your situation?",
  4: "I understand. Do you have access to any medical or legal support at this time, or would you like RAAHAT to help connect you with those services?",
  5: "Thank you for answering these questions. Based on what you have shared, I am now generating your assessment to identify the most appropriate support for your situation. Please wait a moment.",
};

export default function ChatAssessment() {
  const nav = useNavigate();
  const [messages, setMessages] = useState<Msg[]>(INIT);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [turn, setTurn] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  async function send() {
    if (!input.trim()) return;
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Msg = { role: "user", text: input, time: now };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);

    const nextTurn = turn + 1;
    setTurn(nextTurn);

    try {
      const response = await fetch("/api/ai/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const assessment = await response.json();
      if (!response.ok) throw new Error(assessment.error || "AI request failed");
      setTyping(false);
      setMessages(m => [...m, { role: "ai", text: assessment.reply, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
      if (nextTurn >= 5) setTimeout(() => nav("/assessment-result"), 1200);
    } catch {
      setTyping(false);
      const aiText = AI_RESPONSES[nextTurn] ?? "Thank you. Processing your assessment now…";
      setMessages(m => [...m, { role: "ai", text: aiText, time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) }]);
      if (nextTurn >= 5) setTimeout(() => nav("/assessment-result"), 1200);
    }
  }

  return (
    <UserLayout>
      <div className="flex flex-col h-[calc(100vh-52px)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-navy-900">RAAHAT Support Assistant</h1>
              <p className="text-xs text-slate-500 mt-0.5">Share only what you are comfortable sharing. This conversation is confidential.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Globe size={14} />
              <select className="text-sm bg-transparent border border-slate-200 rounded px-2 py-1 outline-none">
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
              <div className={`max-w-[75%] ${msg.role === "user" ? "" : ""}`}>
                <div className={`rounded px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.role === "ai" ? "bg-white border border-slate-200 text-slate-800" : "bg-navy-900 text-white"
                }`}>
                  {msg.text}
                </div>
                <div className={`text-xs text-slate-400 mt-1 ${msg.role === "user" ? "text-right" : ""}`}>{msg.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-navy-900 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">R</div>
              <div className="bg-white border border-slate-200 rounded px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <button className="text-slate-400 hover:text-navy-700 p-2"><Mic size={18} /></button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              className="flex-1 border border-slate-300 rounded px-4 py-2.5 text-sm outline-none focus:border-navy-600"
              placeholder="Type your message…"
            />
            <button onClick={send} disabled={!input.trim()} className="w-10 h-10 bg-navy-900 text-white rounded flex items-center justify-center hover:bg-navy-800 disabled:opacity-40">
              <Send size={16} />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <AlertCircle size={11} />
            <span>Your responses are encrypted and used only for assessment. For emergencies, call <strong className="font-mono">112</strong>.</span>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
