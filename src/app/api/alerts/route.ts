import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { alertCreateSchema, firstZodError } from "@/lib/validation";
import { notifyFamilyOfSos } from "@/lib/sms";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let where = {};
  if (session.role === "FAMILY") {
    const links = await prisma.familyLink.findMany({ where: { familyId: session.userId } });
    where = { elderId: { in: links.map((l) => l.elderId) } };
  } else if (session.role === "ELDER") {
    where = { elderId: session.userId };
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

  const alert = await prisma.alert.create({
    data: { elderId, source: parsed.data.source || "SOS_BUTTON", status: "TRIGGERED" },
  });

  // Fire-and-forget SMS to every linked family member — doesn't block the response
  prisma.familyLink
    .findMany({ where: { elderId }, include: { family: { select: { phone: true } } } })
    .then((links) => {
      const phones = links.map((l) => l.family.phone).filter(Boolean);
      if (phones.length > 0) notifyFamilyOfSos(elder.name, phones);
    })
    .catch((err) => console.error("[sos-sms] failed to notify family", err));

  return NextResponse.json({ alert });
}
