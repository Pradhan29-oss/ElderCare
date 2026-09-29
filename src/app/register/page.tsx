"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"FAMILY" | "CAREGIVER">("FAMILY");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    city: "",
    elderName: "",
    elderPhone: "",
    relation: "Son",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(`/dashboard/${role.toLowerCase()}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Link href="/" className="font-display text-2xl font-semibold text-ink">Setu</Link>
        <h1 className="font-display text-2xl text-ink mt-6 mb-1">Create your account</h1>
        <p className="text-sm text-ink/60 mb-6">Register as a family member coordinating care, or as a caregiver.</p>

        <div className="flex gap-2 mb-6">
          {(["FAMILY", "CAREGIVER"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-full text-sm font-medium border transition ${
                role === r ? "bg-ink text-sand border-ink" : "border-border-soft text-ink/70"
              }`}
            >
              {r === "FAMILY" ? "Family member" : "Caregiver"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Your full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Phone number</label>
              <input
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Password</label>
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">City</label>
            <input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="e.g. San Francisco, USA or Guwahati, Assam"
              className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
            />
          </div>

          {role === "FAMILY" && (
            <div className="border-t border-border-soft pt-4 space-y-4">
              <p className="text-xs font-mono-data uppercase tracking-widest text-ink/40">
                Add the elder you&rsquo;re caring for (optional now)
              </p>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Elder&rsquo;s name</label>
                <input
                  value={form.elderName}
                  onChange={(e) => update("elderName", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Elder&rsquo;s phone</label>
                  <input
                    value={form.elderPhone}
                    onChange={(e) => update("elderPhone", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Relation</label>
                  <select
                    value={form.relation}
                    onChange={(e) => update("relation", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-soft bg-card focus:outline-none focus:ring-2 focus:ring-marigold"
                  >
                    {["Son", "Daughter", "Grandchild", "Relative"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-marigold text-ink font-semibold rounded-full hover:bg-marigold-deep transition disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-marigold-deep font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
}
