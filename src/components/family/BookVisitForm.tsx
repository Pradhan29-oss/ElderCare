"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const serviceTypes = [
  "WELLNESS",
  "GROCERY",
  "BANKING",
  "GOVERNMENT_OFFICE",
  "HOSPITAL_COMPANION",
  "COMPANIONSHIP",
];

export default function BookVisitForm({ elders }: { elders: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [elderId, setElderId] = useState(elders[0]?.id || "");
  const [serviceType, setServiceType] = useState("WELLNESS");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        elderId,
        serviceType,
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
      }),
    });
    setLoading(false);
    setOpen(false);
    setDate("");
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-ink text-sand text-sm font-medium hover:bg-[#152f2b] transition"
      >
        + Book a visit
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-sand-deep rounded-2xl p-5 border border-border-soft space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Elder</label>
          <select
            value={elderId}
            onChange={(e) => setElderId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm"
          >
            {elders.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Service</label>
          <select
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm"
          >
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Time</label>
          <input
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border-soft bg-card text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !elderId}
          className="px-4 py-2 rounded-full bg-marigold text-ink text-sm font-medium hover:bg-marigold-deep transition disabled:opacity-60"
        >
          {loading ? "Booking…" : "Confirm booking"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-full border border-border-soft text-sm text-ink/70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
