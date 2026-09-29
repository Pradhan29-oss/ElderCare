import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { visitUpdateSchema, firstZodError } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = visitUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.visit.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Visit not found." }, { status: 404 });

  if (session.role === "CAREGIVER" && existing.caregiverId !== session.userId) {
    return NextResponse.json({ error: "Not your assigned visit." }, { status: 403 });
  }
  if (session.role !== "CAREGIVER" && !(await canAccessElder(session, existing.elderId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const start = parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null;
  const end = parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null;
  if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (data.scheduledStart) data.scheduledStart = new Date(data.scheduledStart as string);
  if (data.scheduledEnd) data.scheduledEnd = new Date(data.scheduledEnd as string);

  const visit = await prisma.visit.update({ where: { id }, data });

  return NextResponse.json({ visit });
}
