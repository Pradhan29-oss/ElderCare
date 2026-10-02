"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SosButton({ elderId, hasActiveAlert }: { elderId: string; hasActiveAlert: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendAlert() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elderId, source: "SOS_BUTTON" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send the emergency alert.");
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Call 112 if you need urgent help.");
    } finally {
      setLoading(false);
    }
  }

  if (hasActiveAlert) {
    return (
      <div className="w-full py-8 rounded-3xl bg-alert/10 border-2 border-alert text-center">
        <p className="text-2xl font-semibold text-alert mb-1">Alert recorded</p>
        <p className="text-base text-ink/60">Your emergency alert has been recorded. Call 112 if you need immediate help.</p>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="w-full py-8 rounded-3xl bg-alert/10 border-2 border-alert text-center space-y-4">
        <p className="text-2xl font-semibold text-alert">Send emergency alert?</p>
        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
        <div className="flex justify-center gap-4">
          <button
            onClick={sendAlert}
            disabled={loading}
            className="min-h-[64px] px-8 rounded-2xl bg-alert text-white text-xl font-semibold"
          >
            {loading ? "Sending…" : "Yes, send SOS"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="min-h-[64px] px-8 rounded-2xl border-2 border-ink/20 text-xl font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full py-10 rounded-3xl bg-alert text-white text-3xl font-bold tracking-wide shadow-lg active:scale-[0.98] transition"
    >
      🆘 SOS — Tap for help
    </button>
  );
}
