"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const demoAccounts = [
  { role: "Family", phone: "9800000002", password: "family123" },
  { role: "Elder", phone: "9800000003", password: "elder123" },
  { role: "Caregiver", phone: "9800000004", password: "care123" },
  { role: "Admin", phone: "9800000001", password: "admin123" },
];

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      const role = data.user.role.toLowerCase();
      router.push(`/dashboard/${role}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-semibold text-ink">Setu</Link>
        <h1 className="font-display text-2xl text-ink mt-6 mb-1">Welcome back</h1>
        <p className="text-sm text-ink/60 mb-8">Log in to your family, elder, caregiver, or admin account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Phone number</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98000 00002"
              className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
          {error && <p className="text-sm text-alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ink text-sand font-semibold rounded-full hover:bg-[#152f2b] transition disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6">
          New to Setu?{" "}
          <Link href="/register" className="text-marigold-deep font-medium">
            Register your family
          </Link>
        </p>

        <div className="mt-10 border-t border-border-soft pt-6">
          <p className="text-xs font-mono-data uppercase tracking-widest text-ink/40 mb-3">Demo accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((a) => (
              <button
                key={a.role}
                type="button"
                onClick={() => {
                  setPhone(a.phone);
                  setPassword(a.password);
                }}
                className="text-left px-3 py-2 rounded-lg border border-border-soft text-xs hover:border-marigold transition"
              >
                <span className="block font-semibold text-ink">{a.role}</span>
                <span className="text-ink/50 font-mono-data">{a.phone}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
