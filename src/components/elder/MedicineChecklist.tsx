"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Medicine {
  id: string;
  name: string;
  time: string;
  taken: boolean;
}

export default function MedicineChecklist({ medicines }: { medicines: Medicine[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markTaken(id: string) {
    setLoadingId(id);
    await fetch(`/api/medicines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taken: true, lastTakenDate: new Date().toISOString().slice(0, 10) }),
    });
    setLoadingId(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {medicines.map((m) => (
        <div
          key={m.id}
          className={`flex items-center justify-between p-5 rounded-2xl border-2 ${
            m.taken ? "border-sage/40 bg-sage/10" : "border-border-soft bg-card"
          }`}
        >
          <div>
            <p className="text-xl font-semibold text-ink">{m.name}</p>
            <p className="text-base text-ink/50">{m.time}</p>
          </div>
          {m.taken ? (
            <span className="text-sage text-lg font-semibold">✓ Taken</span>
          ) : (
            <button
              onClick={() => markTaken(m.id)}
              disabled={loadingId === m.id}
              className="min-h-[64px] px-6 rounded-2xl bg-marigold text-ink text-lg font-semibold"
            >
              {loadingId === m.id ? "…" : "Mark taken"}
            </button>
          )}
        </div>
      ))}
      {medicines.length === 0 && <p className="text-lg text-ink/50">No medicines scheduled today.</p>}
    </div>
  );
}
