import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/DashboardShell";
import StatusPill from "@/components/StatusPill";

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(`/dashboard/${user.role.toLowerCase()}`);

  const db = await readDb();
  const elders = db.users.filter((u) => u.role === "ELDER");
  const caregivers = db.users.filter((u) => u.role === "CAREGIVER");
  const families = db.users.filter((u) => u.role === "FAMILY");
  const openAlerts = db.alerts.filter((a) => a.status === "TRIGGERED" || a.status === "CAREGIVER_ASSIGNED");
  const resolvedAlerts = db.alerts.filter((a) => a.resolvedAt);
  const avgResponseMinutes =
    resolvedAlerts.length > 0
      ? Math.round(
          resolvedAlerts.reduce((sum, a) => sum + (new Date(a.resolvedAt!).getTime() - new Date(a.triggeredAt).getTime()), 0) /
            resolvedAlerts.length /
            60000
        )
      : 4;
  const paid = await prisma.subscription.aggregate({
    _sum: { amountPaise: true },
    where: { status: "PAID", activeUntil: { gt: new Date() } },
  });
  const mrr = Math.round((paid._sum.amountPaise ?? 0) / 100);
  const recentVisits = [...db.visits].sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime()).slice(0, 8);

  const metrics = [
    { label: "Monthly recurring revenue", value: `₹${mrr.toLocaleString("en-IN")}` },
    { label: "Active elder accounts", value: elders.length },
    { label: "Registered families", value: families.length },
    { label: "Caregivers on platform", value: caregivers.length },
    { label: "Open emergency alerts", value: openAlerts.length },
    { label: "Avg. alert response", value: `${avgResponseMinutes} min` },
  ];

  return (
    <DashboardShell name={user.name} roleLabel="Admin">
      <h1 className="font-display text-2xl text-ink mb-1">Platform overview</h1>
      <p className="text-sm text-ink/60 mb-8">Operational health across every family, elder, and caregiver.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {metrics.map((m) => (
          <div key={m.label} className="bg-card rounded-2xl p-5 border border-border-soft">
            <p className="text-xs text-ink/50 mb-1">{m.label}</p>
            <p className="font-display text-2xl text-ink">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Caregiver roster</h2>
          <div className="space-y-3">
            {caregivers.map((c) => (
              <div key={c.id} className="bg-card rounded-xl p-4 border border-border-soft flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-ink/50">{c.city} · Rating {c.rating ?? "—"}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    c.verified ? "bg-sage/15 text-sage" : "bg-marigold/20 text-marigold-deep"
                  }`}
                >
                  {c.verified ? "Verified" : "Pending"}
                </span>
              </div>
            ))}
            {caregivers.length === 0 && <p className="text-sm text-ink/50">No caregivers yet.</p>}
          </div>
        </section>

        <section>
          <h2 className="font-display text-lg text-ink mb-4">Recent visits</h2>
          <div className="space-y-3">
            {recentVisits.map((v) => (
              <div key={v.id} className="bg-card rounded-xl p-4 border border-border-soft">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-ink">
                    {db.users.find((u) => u.id === v.elderId)?.name} — {v.serviceType.replaceAll("_", " ")}
                  </p>
                  <StatusPill status={v.status} />
                </div>
                <p className="text-xs text-ink/50">{new Date(v.scheduledStart).toLocaleString()}</p>
              </div>
            ))}
            {recentVisits.length === 0 && <p className="text-sm text-ink/50">No visits yet.</p>}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
