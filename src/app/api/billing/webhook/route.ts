import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay-signature";

// Razorpay -> server. Covers "paid but browser closed / DB update failed" cases.
// Set the webhook URL in Razorpay dashboard: https://<your-domain>/api/billing/webhook
// events: payment.captured, payment.failed. Put the same secret in RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });

  const rawBody = await req.text(); // signature is over the RAW body
  const signature = req.headers.get("x-razorpay-signature") || "";
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.order_id) return NextResponse.json({ ok: true }); // ignore unrelated events

  if (event.event === "payment.captured") {
    // Status guard makes duplicate webhooks harmless (idempotent)
    await prisma.subscription.updateMany({
      where: { razorpayOrderId: payment.order_id, status: { not: "PAID" } },
      data: { status: "PAID", razorpayPaymentId: payment.id, activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
  } else if (event.event === "payment.failed") {
    await prisma.subscription.updateMany({
      where: { razorpayOrderId: payment.order_id, status: "CREATED" },
      data: { status: "FAILED" },
    });
  }
  return NextResponse.json({ ok: true });
}
