import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { registerSchema, firstZodError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 5 new accounts per hour per IP — slows down mass fake-account creation
  const limited = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many signups from this connection. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const { name, phone, password, role, city, elderName, elderPhone, relation } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    return NextResponse.json({ error: "An account with this phone number already exists." }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: { name, phone, password: hashedPassword, role, city: city || "" },
  });

  // If a family member also registers an elder in the same flow, create both + link.
  // The elder gets a random temporary password (not a guessable default) —
  // in production, send it to elderPhone via SMS so they can log in themselves.
  if (role === "FAMILY" && elderName && elderPhone) {
    const existingElder = await prisma.user.findUnique({ where: { phone: elderPhone } });
    const elder =
      existingElder ||
      (await prisma.user.create({
        data: {
          name: elderName,
          phone: elderPhone,
          password: await bcrypt.hash(crypto.randomBytes(9).toString("base64url"), 10),
          role: "ELDER",
          city: city || "",
        },
      }));

    await prisma.familyLink.upsert({
      where: { familyId_elderId: { familyId: newUser.id, elderId: elder.id } },
      update: {},
      create: { familyId: newUser.id, elderId: elder.id, relation: relation || "Relative", isPrimary: true },
    });
  }

  await setSessionCookie({ userId: newUser.id, role: newUser.role, name: newUser.name });

  return NextResponse.json({ user: { id: newUser.id, name: newUser.name, role: newUser.role } });
}
