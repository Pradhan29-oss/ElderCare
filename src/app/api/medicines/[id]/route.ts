import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { medicineUpdateSchema, firstZodError } from "@/lib/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = medicineUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.medicine.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Medicine not found." }, { status: 404 });

  if (!(await canAccessElder(session, existing.elderId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const medicine = await prisma.medicine.update({ where: { id }, data: parsed.data });

  return NextResponse.json({ medicine });
}
