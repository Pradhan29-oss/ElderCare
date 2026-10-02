import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import DashboardShell from "@/components/DashboardShell";
import StatusPill from "@/components/StatusPill";
import BookVisitForm from "@/components/family/BookVisitForm";
import ResolveAlertButton from "@/components/ResolveAlertButton";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { billingEnabled } from "@/lib/razorpay";
import { isMedicineTakenToday } from "@/lib/medicine";

export default async function FamilyDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "FAMILY") redirect(`/dashboard/${user.role.toLowerCase()}`);

  const db = await readDb();
  const links = db.familyLinks.filter((l) => l.familyId === user.id);
  const elders = links.map((l) => {
    const elder = db.users.find((u) => u.id === l.elderId)!;
    const openAlert = db.alerts.find(
      (a) => a.elderId === elder.id && (a.status === "TRIGGERED" || a.status === "CAREGIVER_ASSIGNED")
    );
    const upcomingVisit = db.visits
      .filter((v) => v.elderId === elder.id && v.status === "SCHEDULED")
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0];
    const medicines = db.medicines
      .filter((m) => m.elderId === elder.id)
      .map((medicine) => ({ ...medicine, taken: isMedicineTakenToday(medicine) }));
    const takenCount = medicines.filter((m) => m.taken).length;
    return { elder, relation: l.relation, openAlert, upcomingVisit, medicines, takenCount };
  });

  const allElderIds = elders.map((e) => e.elder.id);
  const alerts = db.alerts
    .filter((a) => allElderIds.includes(a.elderId))
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
    .slice(0, 6);

  const visits = db.visits
    .filter((v) => allElderIds.includes(v.elderId))
    .sort((a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime())
    .slice(0, 6);

  return (
    <DashboardShell name={user.name} roleLabel="Family member">
      <h1 className="font-display text-2xl text-ink mb-1">Good to see you, {user.name.split(" ")[0]}</h1>
      <p className="text-sm text-ink/60 mb-8">Here&rsquo;s how things stand for your family today.</p>

      {/* Elder status cards */}
      <div className="grid sm:grid-cols-2 gap-5 mb-10">
        {elders.map(({ elder, relation, openAlert, upcomingVisit, medicines, takenCount }) => (
          <div key={elder.id} className="bg-card rounded-2xl p-6 border border-border-soft">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-display text-xl text-ink">{elder.name}</p>
                <p className="text-xs text-ink/50">{relation} · {elder.city}</p>
              </div>
              <span
                className={`w-3 h-3 rounded-full mt-2 ${openAlert ? "bg-alert animate-pulse" : "bg-sage"}`}
                title={openAlert ? "Active emergency alert" : "All well"}
              />
            </div>

            {openAlert ? (
              <div className="bg-alert/10 rounded-xl p-3 mb-4">
                <p className="text-sm font-medium text-alert mb-1">Emergency alert active</p>
                <p className="text-xs text-ink/60">Triggered {new Date(openAlert.triggeredAt).toLocaleString()}</p>
              </div>
            ) : (
              <div className="bg-sage/10 rounded-xl p-3 mb-4">
                <p className="text-sm font-medium text-sage">All well today</p>
              </div>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-ink/60">Medicines today</span>
                <span className="font-medium text-ink">{takenCount}/{medicines.length} taken</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink/60">Next visit</span>
                <span className="font-medium text-ink">
                  {upcomingVisit ? new Date(upcomingVisit.scheduledStart).toLocaleDateString() : "None scheduled"}
                </span>
              </div>
            </div>
          </div>
        ))}
        {elders.length === 0 && (
          <p className="text-sm text-ink/50">No elders linked to your account yet.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Visits */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Visits</h2>
            <BookVisitForm elders={elders.map((e) => ({ id: e.elder.id, name: e.elder.name }))} />
          </div>
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="bg-card rounded-xl p-4 border border-border-soft flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">{v.serviceType.replaceAll("_", " ")}</p>
                  <p className="text-xs text-ink/50">
                    {db.users.find((u) => u.id === v.elderId)?.name} · {new Date(v.scheduledStart).toLocaleString()}
                  </p>
                </div>
                <StatusPill status={v.status} />
              </div>
            ))}
            {visits.length === 0 && <p className="text-sm text-ink/50">No visits yet.</p>}
          </div>
        </section>

        {/* Alerts */}
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Recent alerts</h2>
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="bg-card rounded-xl p-4 border border-border-soft">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink">
                    {db.users.find((u) => u.id === a.elderId)?.name} · {a.source.replaceAll("_", " ")}
                  </p>
                  <StatusPill status={a.status} />
                </div>
                <p className="text-xs text-ink/50 mb-3">{new Date(a.triggeredAt).toLocaleString()}</p>
                {(a.status === "TRIGGERED" || a.status === "CAREGIVER_ASSIGNED") && (
                  <ResolveAlertButton alertId={a.id} />
                )}
              </div>
            ))}
            {alerts.length === 0 && <p className="text-sm text-ink/50">No alerts. That&rsquo;s good news.</p>}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink mb-4">Subscription</h2>
        <div className="bg-card rounded-2xl p-6 border border-border-soft flex flex-wrap items-center gap-4 justify-between">
          <p className="text-sm text-ink/60 max-w-md">
            {billingEnabled
              ? "Choose a plan for your family."
              : "Subscriptions are disabled in this demo until paid plan benefits can be provided."}
          </p>
          {billingEnabled && (
            <div className="flex gap-3">
              <CheckoutButton plan="STANDARD" label="Upgrade to Standard — ₹1,499/mo" />
              <CheckoutButton plan="PREMIUM" label="Upgrade to Premium — ₹2,999/mo" />
            </div>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}
