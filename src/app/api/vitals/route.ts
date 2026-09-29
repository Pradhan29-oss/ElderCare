import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessElder } from "@/lib/access";
import { vitalCreateSchema, firstZodError } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const elderId = req.nextUrl.searchParams.get("elderId") || session.userId;
  if (!(await canAccessElder(session, elderId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const vitals = await prisma.vital.findMany({
    where: { elderId },
    orderBy: { timestamp: "asc" },
  });

  return NextResponse.json({ vitals });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = vitalCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }

  const targetElderId = parsed.data.elderId || session.userId;
  if (!(await canAccessElder(session, targetElderId))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const vital = await prisma.vital.create({
    data: { elderId: targetElderId, type: parsed.data.type, value: parsed.data.value },
  });

  return NextResponse.json({ vital });
}
