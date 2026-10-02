import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { alertCreateSchema, firstZodError } from "@/lib/validation";
import { notifyFamilyOfSos } from "@/lib/sms";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let where: Prisma.AlertWhereInput = {};
  if (session.role === "FAMILY") {
    const links = await prisma.familyLink.findMany({ where: { familyId: session.userId } });
    where = { elderId: { in: links.map((l) => l.elderId) } };
  } else if (session.role === "ELDER") {
    where = { elderId: session.userId };
  } else if (session.role === "CAREGIVER") {
    where = {
      elder: {
        visitsAsElder: {
          some: {
            caregiverId: session.userId,
            status: { in: ["SCHEDULED", "CAREGIVER_DISPATCHED", "IN_PROGRESS"] },
          },
        },
      },
    };
  }

  const alerts = await prisma.alert.findMany({
    where,
    include: { elder: { select: { name: true } } },
    orderBy: { triggeredAt: "desc" },
  });

  const enriched = alerts.map((a) => ({ ...a, elderName: a.elder?.name || "Unknown" }));

  return NextResponse.json({ alerts: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // SOS is high-stakes but also easy to spam-tap; still cap it sensibly
  // (30/hour) so a stuck button can't flood SMS costs.
  const limited = rateLimit(`sos:${clientIp(req)}`, 30, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many alerts triggered. Please wait a moment." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = alertCreateSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  // Elders can only raise alerts for themselves; other roles must specify a valid elderId
  const elderId = session.role === "ELDER" ? session.userId : parsed.data.elderId || session.userId;

  if (!(await canAccessElder(session, elderId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const elder = await prisma.user.findUnique({ where: { id: elderId } });
  if (!elder || elder.role !== "ELDER") {
    return NextResponse.json({ error: "Elder not found." }, { status: 404 });
  }

  const links = await prisma.familyLink.findMany({
    where: { elderId },
    include: { family: { select: { phone: true } } },
  });
  const alert = await prisma.alert.create({
    data: { elderId, source: parsed.data.source || "SOS_BUTTON", status: "TRIGGERED" },
  });

  const notification = await notifyFamilyOfSos(
    elder.name,
    links.map((link) => link.family.phone).filter(Boolean)
  );

  if (notification.sent < notification.attempted) {
    console.warn("[sos-sms] One or more family notifications were not delivered.", notification);
  }

  return NextResponse.json({ alert, notification });
}
