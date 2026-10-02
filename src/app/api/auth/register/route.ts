import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { registerSchema, firstZodError } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

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

  let newUser;
  try {
    newUser = await prisma.$transaction(async (tx) => {
      if (await tx.user.findUnique({ where: { phone } })) {
        return { conflict: "account" as const };
      }

      const existingElder =
        role === "FAMILY" && elderName && elderPhone
          ? await tx.user.findUnique({ where: { phone: elderPhone } })
          : null;
      if (existingElder && existingElder.role !== "ELDER") {
        return { conflict: "elder" as const };
      }

      const user = await tx.user.create({
        data: {
          name,
          phone,
          password: await bcrypt.hash(password, 10),
          role,
          city: city || "",
        },
      });

      if (role === "FAMILY" && elderName && elderPhone) {
        const elder =
          existingElder ??
          (await tx.user.create({
            data: {
              name: elderName,
              phone: elderPhone,
              password: await bcrypt.hash(crypto.randomBytes(9).toString("base64url"), 10),
              role: "ELDER",
              city: city || "",
            },
          }));

        await tx.familyLink.create({
          data: {
            familyId: user.id,
            elderId: elder.id,
            relation: relation || "Relative",
            isPrimary: true,
          },
        });
      }

      return { user };
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this phone number or elder's phone number already exists." },
        { status: 409 }
      );
    }
    throw err;
  }

  if ("conflict" in newUser) {
    const message =
      newUser.conflict === "account"
        ? "An account with this phone number already exists."
        : "The elder's phone number belongs to a non-elder account.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  await setSessionCookie({ userId: newUser.user.id, role: newUser.user.role, name: newUser.user.name });

  return NextResponse.json({
    user: { id: newUser.user.id, name: newUser.user.name, role: newUser.user.role },
  });
}
