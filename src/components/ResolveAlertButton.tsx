"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResolveAlertButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resolve(status: "RESOLVED" | "FALSE_ALARM") {
    setLoading(true);
    await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
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
  );
}
