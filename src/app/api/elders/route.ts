import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const elderSelect = {
  id: true,
  name: true,
  role: true,
  city: true,
  dob: true,
  bloodGroup: true,
  language: true,
  rating: true,
  verified: true,
  createdAt: true,
} as const;

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "ADMIN") {
    const elders = await prisma.user.findMany({ where: { role: "ELDER" }, select: elderSelect });
    return NextResponse.json({ elders });
  }

  if (session.role === "FAMILY") {
    const links = await prisma.familyLink.findMany({
      where: { familyId: session.userId },
      include: { elder: { select: elderSelect } },
    });
    const elders = links.map((l) => ({ ...l.elder, relation: l.relation }));
    return NextResponse.json({ elders });
  }

  if (session.role === "CAREGIVER") {
    const visits = await prisma.visit.findMany({
      where: {
        caregiverId: session.userId,
        status: { in: ["SCHEDULED", "CAREGIVER_DISPATCHED", "IN_PROGRESS"] },
      },
      include: { elder: { select: elderSelect } },
    });
    const seen = new Map(visits.map((v) => [v.elder.id, v.elder]));
    return NextResponse.json({ elders: Array.from(seen.values()) });
  }

  if (session.role === "ELDER") {
    const elder = await prisma.user.findUnique({ where: { id: session.userId }, select: elderSelect });
    return NextResponse.json({ elders: elder ? [elder] : [] });
  }

  return NextResponse.json({ elders: [] });
}
