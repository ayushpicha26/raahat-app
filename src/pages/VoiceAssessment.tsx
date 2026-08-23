import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserLayout from "../components/UserLayout";
import { Mic, Square, Pause, Trash2, Send, AlertCircle } from "lucide-react";

const STEPS = [
  "Speech transcription",
  "Language detection",
  "Text analysis",
  "Speech-pattern analysis",
  "Vulnerability assessment",
  "SVI generation",
];

export default function VoiceAssessment() {
  const nav = useNavigate();
  const [state, setState] = useState<"ready" | "listening" | "paused" | "processing" | "complete">("ready");
  const [seconds, setSeconds] = useState(0);
  const [procStep, setProcStep] = useState(0);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    if (state === "listening") {
      t = setInterval(() => setSeconds(s => s + 1), 1000);
      setTimeout(() => {
        setTranscript("I am afraid to return home and I do not know what I should do next. They have been threatening my family. I cannot sleep and I feel very unsafe. I have no one to help me in my locality.");
      }, 2000);
    }
    return () => clearInterval(t);
  }, [state]);

  function handleSubmit() {
    setState("processing");
    let step = 0;
    const t = setInterval(() => {
      step++;
      setProcStep(step);
      if (step >= STEPS.length) {
        clearInterval(t);
        setTimeout(() => nav("/assessment-result"), 600);
      }
    }, 700);
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-navy-900">Talk to RAAHAT</h1>
          <p className="text-slate-500 text-sm mt-1">You can describe what happened and how you are feeling. Speak at your own pace. There is no rush.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded p-8 mb-5 text-center">
          {state === "processing" ? (
            <div>
              <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-10 h-10 border-4 border-navy-900 border-t-transparent rounded-full animate-spin" />
              </div>
              <h2 className="font-bold text-navy-900 mb-6">AI Assessment in Progress</h2>
              <div className="space-y-2 text-left max-w-xs mx-auto">
                {STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm ${i < procStep ? "text-safe-700" : i === procStep ? "text-navy-900 font-semibold" : "text-slate-400"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < procStep ? "bg-safe-700 text-white" : i === procStep ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-400"}`}>
                      {i < procStep ? "✓" : i + 1}
                    </div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Microphone */}
              <div className="relative inline-flex">
                {state === "listening" && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-30" />
                )}
                <button
                  onClick={() => setState(state === "ready" ? "listening" : state === "listening" ? "paused" : "listening")}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all ${
                    state === "listening" ? "bg-red-600 hover:bg-red-700" : state === "paused" ? "bg-amber-600 hover:bg-amber-700" : "bg-navy-900 hover:bg-navy-800"
                  }`}
                >
                  {state === "listening" ? <Pause size={32} /> : <Mic size={32} />}
                </button>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">
                  {state === "ready" && "Ready to Record"}
                  {state === "listening" && "Listening…"}
                  {state === "paused" && "Paused"}
                </div>
                {(state === "listening" || state === "paused") && (
                  <div className="font-mono text-2xl font-bold text-navy-900">{fmt(seconds)}</div>
                )}
              </div>

              {state !== "ready" && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button onClick={() => { setState("ready"); setSeconds(0); setTranscript(""); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 border border-slate-200 px-3 py-1.5 rounded">
                    <Trash2 size={14} /> Delete
                  </button>
                  <button onClick={() => { setState("ready"); setSeconds(0); }} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded">
                    <Square size={14} /> Stop
                  </button>
                  {transcript && (
                    <button onClick={handleSubmit} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 px-4 py-1.5 rounded">
                      <Send size={14} /> Submit for Assessment
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Transcript panel */}
        {transcript && state !== "processing" && (
          <div className="bg-white border border-slate-200 rounded p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-navy-900" />
              <span className="text-xs font-bold text-navy-700 uppercase tracking-widest">Live Transcription</span>
            </div>
            <div className="bg-navy-50 rounded p-4 border border-navy-100">
              <p className="text-sm text-navy-900 italic leading-relaxed">"{transcript}"</p>
            </div>
            <p className="text-xs text-slate-400 mt-2">Transcription may not be 100% accurate. Please verify your spoken content.</p>
          </div>
        )}

        <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded p-4 text-xs text-slate-500">
          <AlertCircle size={13} className="mt-0.5 shrink-0 text-slate-400" />
          Your recording is processed securely. It is not stored permanently after assessment is complete.
        </div>
      </div>
    </UserLayout>
  );
}
