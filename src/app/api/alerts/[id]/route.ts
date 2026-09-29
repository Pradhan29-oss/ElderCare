import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { alertUpdateSchema, firstZodError } from "@/lib/validation";

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

  if (!(await canAccessElder(session, existing.elderId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "RESOLVED" || parsed.data.status === "FALSE_ALARM") {
    data.resolvedAt = new Date();
  }

  const alert = await prisma.alert.update({ where: { id }, data });

  return NextResponse.json({ alert });
}
