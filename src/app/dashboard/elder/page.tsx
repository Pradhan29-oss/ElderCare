import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { readDb } from "@/lib/db";
import DashboardShell from "@/components/DashboardShell";
import SosButton from "@/components/elder/SosButton";
import MedicineChecklist from "@/components/elder/MedicineChecklist";

export default async function ElderDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ELDER") redirect(`/dashboard/${user.role.toLowerCase()}`);

  const db = await readDb();
  const hasActiveAlert = db.alerts.some(
    (a) => a.elderId === user.id && (a.status === "TRIGGERED" || a.status === "CAREGIVER_ASSIGNED")
  );
  const medicines = db.medicines.filter((m) => m.elderId === user.id);
  const upcomingVisit = db.visits
    .filter((v) => v.elderId === user.id && v.status === "SCHEDULED")
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())[0];

  return (
    <DashboardShell name={user.name} roleLabel="Elder mode">
      <div className="elder-mode max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="font-display text-3xl text-ink mb-1">Namaste, {user.name.split(" ")[0]}</h1>
          <p className="text-lg text-ink/60">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <SosButton elderId={user.id} hasActiveAlert={hasActiveAlert} />

        <section>
          <h2 className="font-display text-2xl text-ink mb-4">Today&rsquo;s medicines</h2>
          <MedicineChecklist medicines={medicines} />
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink mb-4">Next visit</h2>
          {upcomingVisit ? (
            <div className="bg-card rounded-2xl p-6 border-2 border-border-soft">
              <p className="text-xl font-semibold text-ink">{upcomingVisit.serviceType.replaceAll("_", " ")}</p>
              <p className="text-lg text-ink/60">{new Date(upcomingVisit.scheduledStart).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-lg text-ink/50">No visits scheduled.</p>
          )}
        </section>

        <a
          href="tel:112"
          className="block text-center min-h-[64px] leading-[64px] rounded-2xl border-2 border-ink/20 text-xl font-semibold text-ink"
        >
          📞 Call family
        </a>
      </div>
    </DashboardShell>
  );
}
