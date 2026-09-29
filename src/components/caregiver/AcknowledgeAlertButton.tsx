"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AcknowledgeAlertButton({ alertId }: { alertId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function acknowledge() {
    setLoading(true);
    await fetch(`/api/alerts/${alertId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CAREGIVER_ASSIGNED" }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      disabled={loading}
      onClick={acknowledge}
      className="text-xs px-3 py-1.5 rounded-full bg-alert text-white font-medium hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? "…" : "I'm on my way"}
    </button>
  );
}
