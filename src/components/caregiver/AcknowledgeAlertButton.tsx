"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcknowledgeAlertButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acknowledge() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CAREGIVER_ASSIGNED" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not acknowledge this alert.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <button
      disabled={loading}
      onClick={acknowledge}
      className="text-xs px-3 py-1.5 rounded-full bg-alert text-white font-medium hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? "…" : "I'm on my way"}
    </button>
    {error && <p role="alert" className="text-xs text-alert mt-2">{error}</p>}
    </>
  );
}
