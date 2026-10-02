"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";

type Plan = "BASIC" | "STANDARD" | "PREMIUM" | "ELITE";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutButton({ plan, label }: { plan: Plan; label: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout.");
      if (!window.Razorpay) throw new Error("Payment checkout is still loading. Please try again.");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Setu Elder Care",
        description: `${plan} plan — monthly`,
        handler: async function (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
          try {
            const verifyRes = await fetch("/api/billing/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verification = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verification.error || "Payment verification failed.");
            router.push("/dashboard/family?payment=success");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment could not be verified. Please contact support.");
          }
        },
        theme: { color: "#1c3a35" },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        onClick={startCheckout}
        disabled={loading}
        className="text-center px-4 py-2 rounded-full text-sm font-medium bg-ink text-sand hover:bg-[#152f2b] transition disabled:opacity-50"
      >
        {loading ? "Loading..." : label}
      </button>
      {error && <p className="text-xs text-alert mt-2">{error}</p>}
    </>
  );
}
