import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { registerSchema, loginSchema } from "../src/lib/validation";
import { rateLimit } from "../src/lib/rate-limit";
import { verifyPaymentSignature, verifyWebhookSignature } from "../src/lib/razorpay-signature";

const base = { name: "Test User", phone: "9876543210", password: "secret123", role: "FAMILY" as const };

describe("registration validation", () => {
  it("accepts a valid family signup", () => expect(registerSchema.safeParse(base).success).toBe(true));
  it("REJECTS self-registering as ADMIN (privilege escalation)", () =>
    expect(registerSchema.safeParse({ ...base, role: "ADMIN" }).success).toBe(false));
  it("rejects self-registering as ELDER", () =>
    expect(registerSchema.safeParse({ ...base, role: "ELDER" }).success).toBe(false));
  it("normalises +91 numbers so duplicates can't be created", () => {
    const r = registerSchema.parse({ ...base, phone: "+919876543210" });
    expect(r.phone).toBe("9876543210");
  });
  it("rejects bad phone / short password", () => {
    expect(registerSchema.safeParse({ ...base, phone: "12345" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: "123" }).success).toBe(false);
  });
  it("login normalises phone too", () =>
    expect(loginSchema.parse({ phone: "+919876543210", password: "x" }).phone).toBe("9876543210"));
});

describe("rate limiter", () => {
  it("blocks after the limit", () => {
    const k = "t:" + Math.random();
    for (let i = 0; i < 3; i++) expect(rateLimit(k, 3, 60000).ok).toBe(true);
    expect(rateLimit(k, 3, 60000).ok).toBe(false);
  });
});

describe("razorpay signatures", () => {
  const secret = "test_secret";
  const sig = crypto.createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
  it("accepts a genuine signature", () => expect(verifyPaymentSignature("order_1", "pay_1", sig, secret)).toBe(true));
  it("rejects tampered payment id", () => expect(verifyPaymentSignature("order_1", "pay_2", sig, secret)).toBe(false));
  it("rejects tampered order id", () => expect(verifyPaymentSignature("order_2", "pay_1", sig, secret)).toBe(false));
  it("rejects empty / garbage signature", () => {
    expect(verifyPaymentSignature("order_1", "pay_1", "", secret)).toBe(false);
    expect(verifyPaymentSignature("order_1", "pay_1", "zzzz", secret)).toBe(false);
  });
  it("webhook: valid vs forged body", () => {
    const body = '{"event":"payment.captured"}';
    const s = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, s, secret)).toBe(true);
    expect(verifyWebhookSignature(body + " ", s, secret)).toBe(false);
  });
});
