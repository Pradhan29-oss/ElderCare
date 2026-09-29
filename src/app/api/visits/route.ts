import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { bookVisitSchema, firstZodError } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let where = {};
  if (session.role === "FAMILY") {
    const links = await prisma.familyLink.findMany({ where: { familyId: session.userId } });
    where = { elderId: { in: links.map((l) => l.elderId) } };
  } else if (session.role === "ELDER") {
    where = { elderId: session.userId };
  } else if (session.role === "CAREGIVER") {
    where = { caregiverId: session.userId };
  }

  const visits = await prisma.visit.findMany({
    where,
    include: { elder: { select: { name: true } }, caregiver: { select: { name: true } } },
    orderBy: { scheduledStart: "desc" },
  });

  const enriched = visits.map((v) => ({
    ...v,
    elderName: v.elder?.name || "Unknown",
    caregiverName: v.caregiver?.name || "Unassigned",
  }));

  return NextResponse.json({ visits: enriched });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "FAMILY" && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Only family members can book visits." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bookVisitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const { elderId, serviceType, scheduledStart, scheduledEnd } = parsed.data;

  // Family members can only book visits for elders actually linked to them
  if (session.role === "FAMILY") {
    const link = await prisma.familyLink.findUnique({
      where: { familyId_elderId: { familyId: session.userId, elderId } },
    });
    if (!link) {
      return NextResponse.json({ error: "That elder isn't linked to your account." }, { status: 403 });
    }
  }

  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: "Invalid visit time range." }, { status: 400 });
  }

  const availableCaregiver = await prisma.caregiverMeta.findFirst({ where: { onDuty: true } });

  const visit = await prisma.visit.create({
    data: {
      elderId,
      caregiverId: availableCaregiver?.userId || null,
      serviceType,
      scheduledStart: start,
      scheduledEnd: end,
      status: "SCHEDULED",
    },
  });

  return NextResponse.json({ visit });
}
