interface BadgeProps {
  priority: string;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, size = "sm" }: BadgeProps) {
  const styles: Record<string, string> = {
    Critical: "bg-critical-50 text-critical-700 border border-critical-100",
    High: "bg-high-50 text-high-700 border border-high-100",
    Moderate: "bg-amber-50 text-amber-700 border border-amber-100",
    Low: "bg-safe-50 text-safe-700 border border-safe-100",
  };
  const px = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  return (
    <span className={`inline-flex items-center font-semibold rounded ${px} ${styles[priority] ?? "bg-slate-100 text-slate-600"}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const isGreen = ["Resolved", "Closed", "Verified", "Support Assigned"].includes(status);
  const isRed = ["Human Review Required"].includes(status);
  const isAmber = ["Under Review", "In Progress", "Assessment Pending", "Counsellor Assigned"].includes(status);
  const cls = isGreen
    ? "bg-safe-50 text-safe-700 border border-safe-100"
    : isRed
    ? "bg-critical-50 text-critical-700 border border-critical-100"
    : isAmber
    ? "bg-amber-50 text-amber-700 border border-amber-100"
    : "bg-navy-50 text-navy-800 border border-navy-100";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded ${cls}`}>
      {status}
    </span>
  );
}
