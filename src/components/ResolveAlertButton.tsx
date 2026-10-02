"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveAlertButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolve(status: "RESOLVED" | "FALSE_ALARM") {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update this alert.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => resolve("RESOLVED")}
        className="text-xs px-3 py-1.5 rounded-full bg-sage text-white font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        Mark resolved
      </button>
      <button
        disabled={loading}
        onClick={() => resolve("FALSE_ALARM")}
        className="text-xs px-3 py-1.5 rounded-full border border-border-soft text-ink/60 hover:border-ink/40 transition disabled:opacity-50"
      >
        False alarm
      </button>
    </div>
    {error && <p role="alert" className="text-xs text-alert mt-2">{error}</p>}
    </>
  );
}
