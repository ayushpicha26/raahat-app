/**
 * CaseJourneyTracker.tsx — Visual Stakeholder Workflow Tracker
 *
 * Shows the case's journey through stakeholders:
 * NLP → Counsellor → DoSJE → Police → Special Court → Closed
 *
 * Each step displays:
 *  - Status (completed / in progress / pending / overdue)
 *  - Stakeholder role + assigned officer
 *  - SLA deadline timer
 *  - Forward button (for admin roles)
 */

import { useEffect, useState } from "react";
import { getToken } from "../../utils/api";

interface JourneyStep {
  id: number;
  step_order: number;
  step_name: string;
  stakeholder_role: string;
  assigned_user_id: number | null;
  assigned_user_name: string | null;
  status: "pending" | "in_progress" | "completed" | "skipped" | "overdue";
  started_at: string | null;
  completed_at: string | null;
  sla_hours: number;
  sla_deadline: string | null;
  notes: string | null;
}

interface Journey {
  case_id: string;
  total_steps: number;
  completed_steps: number;
  progress_percent: number;
  current_step: JourneyStep | null;
  current_handler: {
    role: string;
    name: string;
    step_name: string;
    label: string | null;
  } | null;
  steps: JourneyStep[];
}

const ROLE_LABELS: Record<string, string> = {
  system: "AI System",
  counsellor: "Counsellor",
  dosje: "DoSJE Officer (DSWO)",
  police: "Police Officer",
  admin: "District Admin",
  welfare: "Welfare Officer",
  nhaa_admin: "NHAA Admin",
};

const ROLE_COLORS: Record<string, string> = {
  system: "#6b7280",
  counsellor: "#0ea5e9",
  dosje: "#9333ea",
  police: "#dc2626",
  admin: "#16a34a",
  welfare: "#ea580c",
  nhaa_admin: "#1e40af",
};

const ROLE_ICONS: Record<string, string> = {
  system: "🤖",
  counsellor: "🧑‍⚕️",
  dosje: "🏛️",
  police: "👮",
  admin: "👤",
  welfare: "🤝",
  nhaa_admin: "🇮🇳",
};

export default function CaseJourneyTracker({ caseId }: { caseId: string }) {
  const [journey, setJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  const token = getToken();
  const user = JSON.parse(localStorage.getItem("raahat_user") || "{}");
  const isAdmin = user.role === "admin" || user.role === "nhaa_admin";

  async function loadJourney() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/journey`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load journey");
      const data = await res.json();
      setJourney(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (caseId) loadJourney();
  }, [caseId]);

  async function handleComplete(stepId: number) {
    setActionLoading(stepId);
    try {
      const res = await fetch(`/api/cases/${caseId}/journey/${stepId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notes: noteText }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to complete step");
      }
      setNoteText("");
      setShowNotesFor(null);
      await loadJourney();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        Loading case journey…
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div style={{ padding: 16, background: "#fee2e2", color: "#991b1b", borderRadius: 8 }}>
        {error || "No journey data available"}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: "#1e40af" }}>
          📍 Case Journey Tracker
        </h3>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
          Case ID: <strong>{caseId}</strong> · {journey.completed_steps} of {journey.total_steps} steps complete
        </p>
      </div>

      {/* Current Handler Badge */}
      {journey.current_handler && (
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            border: "1px solid #93c5fd",
            borderRadius: 10,
            padding: 16,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 32 }}>
            {ROLE_ICONS[journey.current_handler.role] || "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Currently With
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1e3a8a", marginTop: 2 }}>
              {journey.current_handler.name}
            </div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 2 }}>
              Step: {journey.current_handler.step_name}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>Progress</span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{journey.progress_percent}%</span>
        </div>
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: 999,
            height: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(90deg, #1e40af, #3b82f6)",
              width: `${journey.progress_percent}%`,
              height: "100%",
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: "relative" }}>
        {journey.steps.map((step, idx) => {
          const isLast = idx === journey.steps.length - 1;
          const status = step.status;
          const isCompleted = status === "completed";
          const isInProgress = status === "in_progress";
          const isOverdue = status === "overdue";
          const isPending = status === "pending";
          const color = ROLE_COLORS[step.stakeholder_role] || "#6b7280";

          return (
            <div key={step.id} style={{ position: "relative", paddingLeft: 44, paddingBottom: isLast ? 0 : 12 }}>
              {/* Vertical line */}
              {!isLast && (
                <div
                  style={{
                    position: "absolute",
                    left: 15,
                    top: 28,
                    bottom: -4,
                    width: 2,
                    background: isCompleted ? color : "#e5e7eb",
                  }}
                />
              )}

              {/* Circle marker */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: isCompleted ? color : isInProgress || isOverdue ? "#fff" : "#f9fafb",
                  border: `3px solid ${isCompleted || isInProgress || isOverdue ? color : "#d1d5db"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: isCompleted ? "#fff" : color,
                  boxShadow: isInProgress ? `0 0 0 4px ${color}20` : "none",
                }}
              >
                {isCompleted ? "✓" : isOverdue ? "!" : idx + 1}
              </div>

              {/* Card */}
              <div
                style={{
                  background: isInProgress ? `${color}08` : isOverdue ? "#fef2f2" : "#fafafa",
                  border: `1px solid ${isInProgress ? color : isOverdue ? "#fca5a5" : "#e5e7eb"}`,
                  borderRadius: 8,
                  padding: 12,
                  marginLeft: 4,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{ROLE_ICONS[step.stakeholder_role]}</span>
                      <strong style={{ fontSize: 14, color: "#111827" }}>{step.step_name}</strong>
                      <StatusBadge status={status} />
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginLeft: 26 }}>
                      {ROLE_LABELS[step.stakeholder_role]}
                      {step.assigned_user_name && ` · ${step.assigned_user_name}`}
                    </div>

                    {/* SLA Info */}
                    {step.sla_deadline && !isCompleted && (
                      <div
                        style={{
                          fontSize: 11,
                          color: isOverdue ? "#dc2626" : "#6b7280",
                          marginTop: 4,
                          marginLeft: 26,
                          fontWeight: isOverdue ? 600 : 400,
                        }}
                      >
                        {isOverdue ? "⚠️ OVERDUE · " : "⏱ SLA: "}
                        {new Date(step.sla_deadline).toLocaleString()}
                      </div>
                    )}

                    {/* Completed timestamp */}
                    {isCompleted && step.completed_at && (
                      <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4, marginLeft: 26 }}>
                        ✓ Completed {new Date(step.completed_at).toLocaleString()}
                      </div>
                    )}

                    {/* Notes */}
                    {step.notes && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#374151",
                          background: "#f9fafb",
                          padding: "6px 10px",
                          borderRadius: 4,
                          marginTop: 6,
                          marginLeft: 26,
                          fontStyle: "italic",
                        }}
                      >
                        "{step.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Action */}
                {isAdmin && (isInProgress || isOverdue) && (
                  <div style={{ marginTop: 10, marginLeft: 26 }}>
                    {showNotesFor === step.id ? (
                      <div>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Add completion notes (optional)…"
                          style={{
                            width: "100%",
                            minHeight: 60,
                            padding: 8,
                            borderRadius: 6,
                            border: "1px solid #d1d5db",
                            fontSize: 13,
                            fontFamily: "inherit",
                          }}
                        />
                        <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                          <button
                            onClick={() => handleComplete(step.id)}
                            disabled={actionLoading === step.id}
                            style={{
                              background: color,
                              color: "#fff",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: 6,
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: actionLoading === step.id ? "wait" : "pointer",
                              opacity: actionLoading === step.id ? 0.6 : 1,
                            }}
                          >
                            {actionLoading === step.id ? "Forwarding…" : "✓ Mark Complete & Forward"}
                          </button>
                          <button
                            onClick={() => {
                              setShowNotesFor(null);
                              setNoteText("");
                            }}
                            style={{
                              background: "#f3f4f6",
                              color: "#374151",
                              border: "1px solid #d1d5db",
                              padding: "6px 14px",
                              borderRadius: 6,
                              fontSize: 13,
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNotesFor(step.id)}
                        style={{
                          background: color,
                          color: "#fff",
                          border: "none",
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Complete This Step →
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Closed banner */}
      {journey.completed_steps === journey.total_steps && (
        <div
          style={{
            background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
            border: "1px solid #10b981",
            borderRadius: 10,
            padding: 16,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 28 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#065f46", marginTop: 4 }}>
            Case Journey Complete
          </div>
          <div style={{ fontSize: 13, color: "#047857", marginTop: 4 }}>
            All stakeholders have completed their actions on this case.
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: "#d1fae5", color: "#065f46", label: "Done" },
    in_progress: { bg: "#dbeafe", color: "#1e40af", label: "Active" },
    overdue: { bg: "#fee2e2", color: "#991b1b", label: "Overdue" },
    pending: { bg: "#f3f4f6", color: "#6b7280", label: "Pending" },
    skipped: { bg: "#fef3c7", color: "#92400e", label: "Skipped" },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {s.label}
    </span>
  );
}
