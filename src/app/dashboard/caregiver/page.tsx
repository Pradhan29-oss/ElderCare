import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import DashboardShell from "@/components/DashboardShell";
import StatusPill from "@/components/StatusPill";
import VisitActions from "@/components/caregiver/VisitActions";
import AcknowledgeAlertButton from "@/components/caregiver/AcknowledgeAlertButton";

export default async function CaregiverDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "CAREGIVER") redirect(`/dashboard/${user.role.toLowerCase()}`);

  const db = await readDb();
  const visits = db.visits
    .filter((v) => v.caregiverId === user.id)
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());

  const activeVisits = visits.filter((v) => v.status === "SCHEDULED" || v.status === "IN_PROGRESS");
  const pastVisits = visits.filter((v) => v.status === "COMPLETED" || v.status === "CANCELLED");

  const myElderIds = new Set(visits.map((v) => v.elderId));
  const relevantAlerts = db.alerts
    .filter((a) => myElderIds.has(a.elderId) && (a.status === "TRIGGERED" || a.status === "CAREGIVER_ASSIGNED"))
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());

  return (
    <DashboardShell name={user.name} roleLabel="Caregiver">
      <h1 className="font-display text-2xl text-ink mb-1">Your visits, {user.name.split(" ")[0]}</h1>
      <p className="text-sm text-ink/60 mb-8">Rating {user.rating ?? "—"} · {user.verified ? "Verified" : "Pending verification"}</p>

      {relevantAlerts.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg text-alert mb-4">Emergency alerts near you</h2>
          <div className="space-y-3">
            {relevantAlerts.map((a) => (
              <div key={a.id} className="bg-alert/10 border border-alert/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {db.users.find((u) => u.id === a.elderId)?.name} · {a.source.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-ink/50">{new Date(a.triggeredAt).toLocaleString()}</p>
                </div>
                {a.status === "TRIGGERED" && <AcknowledgeAlertButton alertId={a.id} />}
                {a.status === "CAREGIVER_ASSIGNED" && <StatusPill status={a.status} />}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-display text-lg text-ink mb-4">Upcoming & active</h2>
        <div className="space-y-3">
          {activeVisits.map((v) => (
            <div key={v.id} className="bg-card rounded-xl p-4 border border-border-soft">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {db.users.find((u) => u.id === v.elderId)?.name} — {v.serviceType.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-ink/50">{new Date(v.scheduledStart).toLocaleString()}</p>
                </div>
                <StatusPill status={v.status} />
              </div>
              <VisitActions visitId={v.id} status={v.status} />
            </div>
          ))}
          {activeVisits.length === 0 && <p className="text-sm text-ink/50">No active visits assigned.</p>}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg text-ink mb-4">Completed</h2>
        <div className="space-y-3">
          {pastVisits.map((v) => (
            <div key={v.id} className="bg-card rounded-xl p-4 border border-border-soft">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-ink">
                  {db.users.find((u) => u.id === v.elderId)?.name} — {v.serviceType.replaceAll("_", " ")}
                </p>
                <StatusPill status={v.status} />
              </div>
              <p className="text-xs text-ink/50">{new Date(v.scheduledStart).toLocaleDateString()}</p>
              {v.notes && <p className="text-sm text-ink/70 mt-2">{v.notes}</p>}
            </div>
          ))}
          {pastVisits.length === 0 && <p className="text-sm text-ink/50">No completed visits yet.</p>}
        </div>
      </section>
    </DashboardShell>
  );
}
