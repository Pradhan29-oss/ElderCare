import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { visitUpdateSchema, firstZodError } from "@/lib/validation";
import { Prisma } from "@prisma/client";

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

  if (session.role === "CAREGIVER") {
    if (existing.caregiverId !== session.userId) {
      return NextResponse.json({ error: "Not your assigned visit." }, { status: 403 });
    }
    if (parsed.data.scheduledStart || parsed.data.scheduledEnd) {
      return NextResponse.json({ error: "Caregivers cannot change visit times." }, { status: 403 });
    }
    if (
      parsed.data.status &&
      !(
        ((existing.status === "SCHEDULED" || existing.status === "CAREGIVER_DISPATCHED") &&
          parsed.data.status === "IN_PROGRESS") ||
        (existing.status === "IN_PROGRESS" && parsed.data.status === "COMPLETED")
      )
    ) {
      return NextResponse.json({ error: "Invalid visit status transition." }, { status: 409 });
    }
  } else if (session.role === "FAMILY") {
    if (!(await canAccessElder(session, existing.elderId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.status !== "SCHEDULED" || parsed.data.status !== "CANCELLED" || Object.keys(parsed.data).length !== 1) {
      return NextResponse.json({ error: "Family members can only cancel scheduled visits." }, { status: 403 });
    }
  } else if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const start = parsed.data.scheduledStart ? new Date(parsed.data.scheduledStart) : null;
  const end = parsed.data.scheduledEnd ? new Date(parsed.data.scheduledEnd) : null;
  if ((start && isNaN(start.getTime())) || (end && isNaN(end.getTime()))) {
    return NextResponse.json({ error: "Invalid date." }, { status: 400 });
  }
  const nextStart = start ?? existing.scheduledStart;
  const nextEnd = end ?? existing.scheduledEnd;
  if (nextEnd <= nextStart) {
    return NextResponse.json({ error: "Visit end time must be after its start time." }, { status: 400 });
  }

  const data: Prisma.VisitUpdateInput = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (start) data.scheduledStart = start;
  if (end) data.scheduledEnd = end;

  const visit = await prisma.visit.update({ where: { id }, data });

  return NextResponse.json({ visit });
}
