import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { verifyPaymentSignature } from "@/lib/razorpay-signature";

const bodySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid verification payload." }, { status: 400 });
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  // The order must exist and belong to the logged-in user (prevents activating someone else's order)
  const sub = await prisma.subscription.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!sub || sub.userId !== session.userId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Idempotent: refreshing / double-submitting never extends access twice
  if (sub.status === "PAID") return NextResponse.json({ subscription: sub });

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret)) {
    console.warn("[billing] invalid payment signature", { orderId: razorpay_order_id, userId: session.userId });
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
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
