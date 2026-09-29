const colorMap: Record<string, string> = {
  SCHEDULED: "bg-sage/15 text-sage",
  CAREGIVER_DISPATCHED: "bg-marigold/20 text-marigold-deep",
  IN_PROGRESS: "bg-marigold/20 text-marigold-deep",
  COMPLETED: "bg-ink/10 text-ink/60",
  CANCELLED: "bg-alert/10 text-alert",
  TRIGGERED: "bg-alert/15 text-alert",
  CAREGIVER_ASSIGNED: "bg-marigold/20 text-marigold-deep",
  RESOLVED: "bg-sage/15 text-sage",
  FALSE_ALARM: "bg-ink/10 text-ink/50",
};

export default function StatusPill({ status }: { status: string }) {
  const classes = colorMap[status] || "bg-ink/10 text-ink/60";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium font-mono-data ${classes}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
