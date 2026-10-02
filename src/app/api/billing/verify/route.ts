import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyPaymentSignature } from "@/lib/razorpay-signature";
import { PLAN_PRICES_PAISE, razorpay } from "@/lib/razorpay";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().regex(/^[a-f0-9]{64}$/i),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "FAMILY") {
    return NextResponse.json({ error: "Only family accounts can purchase a subscription." }, { status: 403 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || !razorpay) {
    return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification payload." }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // The order must exist and belong to the logged-in user (prevents activating someone else's order)
  const sub = await prisma.subscription.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!sub || sub.userId !== session.userId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
    console.warn("[billing] invalid payment signature", { orderId: razorpay_order_id, userId: session.userId });
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  // Idempotent: accept only the same signed payment on a completed order.
  if (sub.status === "PAID") {
    if (sub.razorpayPaymentId !== razorpay_payment_id) {
      return NextResponse.json({ error: "This order was already paid with a different payment." }, { status: 409 });
    }
    return NextResponse.json({ subscription: sub });
  }

  const payment = await razorpay.payments.fetch(razorpay_payment_id);
  if (
    payment.order_id !== razorpay_order_id ||
    payment.amount !== sub.amountPaise ||
    payment.amount !== PLAN_PRICES_PAISE[sub.plan] ||
    payment.currency !== "INR" ||
    payment.status !== "captured"
  ) {
    return NextResponse.json({ error: "Payment is not captured for the expected order and amount." }, { status: 400 });
  }

  // updateMany with status guard = safe against concurrent verify + webhook
  await prisma.subscription.updateMany({
    where: { razorpayOrderId: razorpay_order_id, status: { not: "PAID" } },
    data: {
      status: "PAID",
      razorpayPaymentId: razorpay_payment_id,
      activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  const updated = await prisma.subscription.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  return NextResponse.json({ subscription: updated });
}
