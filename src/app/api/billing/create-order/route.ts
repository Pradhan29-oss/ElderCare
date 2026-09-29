import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { razorpay, PLAN_PRICES_PAISE } from "@/lib/razorpay";
import { z } from "zod";

const bodySchema = z.object({ plan: z.enum(["BASIC", "STANDARD", "PREMIUM", "ELITE"]) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!razorpay) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
      { status: 503 }
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  const amountPaise = PLAN_PRICES_PAISE[parsed.data.plan];

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: `sub_${session.userId}_${Date.now()}`,
    notes: { userId: session.userId, plan: parsed.data.plan },
  });

  await prisma.subscription.create({
    data: {
      userId: session.userId,
      plan: parsed.data.plan,
      amountPaise,
      razorpayOrderId: order.id,
      status: "CREATED",
    },
  });

  return NextResponse.json({
    orderId: order.id,
    amount: amountPaise,
    currency: "INR",
    keyId: process.env.RAZORPAY_KEY_ID,
  });
}
