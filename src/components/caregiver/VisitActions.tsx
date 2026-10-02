"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VisitActions({ visitId, status }: { visitId: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(newStatus: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/visits/${visitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extra }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update this visit.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "SCHEDULED") {
    return (
      <>
      <button
        disabled={loading}
        onClick={() => updateStatus("IN_PROGRESS")}
        className="text-sm px-4 py-2 rounded-full bg-marigold text-ink font-medium hover:bg-marigold-deep transition disabled:opacity-50"
      >
        Check in
      </button>
      {error && <p role="alert" className="text-sm text-alert mt-2">{error}</p>}
      </>
    );
  }

  if (status === "IN_PROGRESS" && !showReport) {
    return (
      <button
        onClick={() => setShowReport(true)}
        className="text-sm px-4 py-2 rounded-full bg-sage text-white font-medium hover:opacity-90 transition"
      >
        Complete visit
      </button>
    );
  }

  if (status === "IN_PROGRESS" && showReport) {
    return (
      <>
      <div className="w-full mt-2 space-y-2">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Visit report — what did you observe or complete?"
          className="w-full text-sm px-3 py-2 rounded-lg border border-border-soft bg-card"
          rows={2}
        />
        <button
          disabled={loading}
          onClick={() => updateStatus("COMPLETED", { notes })}
          className="text-sm px-4 py-2 rounded-full bg-sage text-white font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Saving…" : "Submit report"}
        </button>
      </div>
      {error && <p role="alert" className="text-sm text-alert">{error}</p>}
      </>
    );
  }

  return null;
}
