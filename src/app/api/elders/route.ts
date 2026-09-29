import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "ADMIN") {
    const elders = await prisma.user.findMany({ where: { role: "ELDER" } });
    return NextResponse.json({ elders });
  }

  if (session.role === "FAMILY") {
    const links = await prisma.familyLink.findMany({
      where: { familyId: session.userId },
      include: { elder: true },
    });
    const elders = links.map((l) => ({ ...l.elder, relation: l.relation }));
    return NextResponse.json({ elders });
  }

  if (session.role === "CAREGIVER") {
    const visits = await prisma.visit.findMany({
      where: { caregiverId: session.userId },
      include: { elder: true },
    });
    const seen = new Map(visits.map((v) => [v.elder.id, v.elder]));
    return NextResponse.json({ elders: Array.from(seen.values()) });
  }

  if (session.role === "ELDER") {
    const elder = await prisma.user.findUnique({ where: { id: session.userId } });
    return NextResponse.json({ elders: elder ? [elder] : [] });
  }

  return NextResponse.json({ elders: [] });
}
