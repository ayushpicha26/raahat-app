import { AssessmentResultData, performAiAssessment } from "./aiEngine";
import { api, getToken } from "./api";

const STORAGE_KEY = "raahat_latest_assessment";

const DEFAULT_TRANSCRIPT = "I am afraid to return home and I do not know what I should do next. They have been threatening my family. I cannot sleep and I feel very unsafe. I have no one to help me in my locality.";

export function clearStoredAssessment(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("raahat:assessment-updated", { detail: null }));
  } catch (e) {
    console.error("Failed to clear stored assessment", e);
  }
}

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
  fallback.id = `RAH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  return fallback;
}

export function saveAssessment(assessment: AssessmentResultData): void {
  try {
    // Ensure every assessment gets its own unique ID if not assigned
    if (!assessment.id || assessment.id === "RAH-2026-00124") {
      assessment.id = `RAH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    
    // Also dispatch custom event so open tabs or active components can react
    window.dispatchEvent(new CustomEvent("raahat:assessment-updated", { detail: assessment }));

    // If authenticated, also save to real backend database asynchronously
    if (getToken()) {
      api.post<{ ok: boolean; caseId: string }>("/cases", assessment)
        .then(res => {
          if (res.ok && res.data && res.data.caseId) {
            console.log("Assessment synced to server with case ID:", res.data.caseId);
            const updated = { ...assessment, id: res.data.caseId };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent("raahat:assessment-updated", { detail: updated }));
          }
        })
        .catch(err => {
          console.error("Error syncing assessment to server:", err);
        });
    }
  } catch (e) {
    console.error("Failed to save assessment", e);
  }
}
