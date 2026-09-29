import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [activeElders, caregivers, pendingVerification, openAlerts, resolvedAlerts, completedVisits, scheduledVisits, activeSubs] =
    await Promise.all([
      prisma.user.count({ where: { role: "ELDER" } }),
      prisma.user.count({ where: { role: "CAREGIVER" } }),
      prisma.user.count({ where: { role: "CAREGIVER", verified: false } }),
      prisma.alert.count({ where: { status: { in: ["TRIGGERED", "CAREGIVER_ASSIGNED"] } } }),
      prisma.alert.findMany({ where: { resolvedAt: { not: null } } }),
      prisma.visit.count({ where: { status: "COMPLETED" } }),
      prisma.visit.count({ where: { status: "SCHEDULED" } }),
      prisma.subscription.aggregate({
        _sum: { amountPaise: true },
        where: { status: "PAID", activeUntil: { gt: new Date() } },
      }),
    ]);

  const avgResponseMinutes =
    resolvedAlerts.length > 0
      ? Math.round(
          resolvedAlerts.reduce((sum, a) => {
            const diff = new Date(a.resolvedAt!).getTime() - new Date(a.triggeredAt).getTime();
            return sum + diff / 60000;
          }, 0) / resolvedAlerts.length
        )
      : 4;

  return NextResponse.json({
    stats: {
      activeElders,
      caregivers,
      pendingVerification,
      openAlerts,
      avgResponseMinutes,
      completedVisits,
      scheduledVisits,
      mrr: Math.round(activeSubs._sum.amountPaise ? activeSubs._sum.amountPaise / 100 : 0),
    },
  });
}
