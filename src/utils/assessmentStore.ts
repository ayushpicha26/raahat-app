import { AssessmentResultData, performAiAssessment } from "./aiEngine";

const STORAGE_KEY = "raahat_latest_assessment";

const DEFAULT_TRANSCRIPT = "I am afraid to return home and I do not know what I should do next. They have been threatening my family. I cannot sleep and I feel very unsafe. I have no one to help me in my locality.";

export function getStoredAssessment(): AssessmentResultData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.transcript) return parsed;
    }
  } catch (e) {
    console.error("Failed to read stored assessment", e);
  }
  // Default demo fallback if no assessment has been done yet
  const fallback = performAiAssessment(DEFAULT_TRANSCRIPT, 14, "English");
  fallback.id = "RAH-2026-00124";
  return fallback;
}

export function saveAssessment(assessment: AssessmentResultData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    // Also dispatch custom event so open tabs or active components can react
    window.dispatchEvent(new CustomEvent("raahat:assessment-updated", { detail: assessment }));
  } catch (e) {
    console.error("Failed to save assessment", e);
  }
}
