import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { loginSchema, firstZodError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 10 attempts per 15 min per IP — stops brute-forcing phone/password combos
  const limited = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSec) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstZodError(parsed.error) }, { status: 400 });
  }
  const { phone, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phone } });

  // Same generic message whether phone doesn't exist or password is wrong —
  // avoids leaking which phone numbers are registered.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid phone number or password." }, { status: 401 });
  }

  await setSessionCookie({ userId: user.id, role: user.role, name: user.name });

  return NextResponse.json({
    user: { id: user.id, name: user.name, role: user.role },
  });
}
