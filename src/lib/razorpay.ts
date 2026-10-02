import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

export const razorpay = keyId && keySecret ? new Razorpay({ key_id: keyId, key_secret: keySecret }) : null;
export const billingEnabled = process.env.BILLING_ENABLED === "true";

// Prices in paise (₹1 = 100 paise). Monthly billing.
export const PLAN_PRICES_PAISE: Record<"BASIC" | "STANDARD" | "PREMIUM" | "ELITE", number> = {
  BASIC: 49900, // ₹499
  STANDARD: 149900, // ₹1,499
  PREMIUM: 299900, // ₹2,999
  ELITE: 599900, // ₹5,999
};
