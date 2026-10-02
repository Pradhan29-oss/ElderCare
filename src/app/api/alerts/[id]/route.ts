import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { alertUpdateSchema, firstZodError } from "@/lib/validation";
import { Prisma } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = alertUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.alert.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Alert not found." }, { status: 404 });

  if (session.role === "CAREGIVER") {
    if (
      !(await canAccessElder(session, existing.elderId)) ||
      existing.status !== "TRIGGERED" ||
      parsed.data.status !== "CAREGIVER_ASSIGNED" ||
      Object.keys(parsed.data).length !== 1
    ) {
      return NextResponse.json({ error: "Caregivers may only acknowledge an active assigned alert." }, { status: 403 });
    }
  } else if (session.role === "FAMILY") {
    if (
      !(await canAccessElder(session, existing.elderId)) ||
      !["TRIGGERED", "CAREGIVER_ASSIGNED"].includes(existing.status) ||
      !["RESOLVED", "FALSE_ALARM"].includes(parsed.data.status || "")
    ) {
      return NextResponse.json({ error: "Family members may only resolve an active linked alert." }, { status: 403 });
    }
  } else if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Prisma.AlertUpdateInput = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.resolutionNotes !== undefined) data.resolutionNotes = parsed.data.resolutionNotes;
  if (parsed.data.status === "RESOLVED" || parsed.data.status === "FALSE_ALARM") {
    data.resolvedAt = new Date();
  }

  const alert = await prisma.alert.update({ where: { id }, data });

  return NextResponse.json({ alert });
}
