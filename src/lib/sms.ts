import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_FROM_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Sends an SMS. If Twilio env vars aren't set (e.g. local dev without a
 * Twilio account), this logs to the console instead of throwing — so the
 * rest of the app keeps working without SMS configured.
 */
export async function sendSms(to: string, body: string): Promise<{ sent: boolean; error?: string }> {
  if (!client || !fromNumber) {
    console.warn(`[sms:not-configured] Would send to ${to}: ${body}`);
    return { sent: false, error: "SMS not configured (missing TWILIO_* env vars)" };
  }

  // Twilio expects E.164 format; assume India (+91) if a bare 10-digit number is given
  const formattedTo = to.startsWith("+") ? to : `+91${to.replace(/\D/g, "").slice(-10)}`;

  try {
    await client.messages.create({ to: formattedTo, from: fromNumber, body });
    return { sent: true };
  } catch (err) {
    console.error("[sms:error]", err);
    return { sent: false, error: err instanceof Error ? err.message : "Unknown SMS error" };
  }
}

export async function notifyFamilyOfSos(elderName: string, familyPhones: string[]) {
  const body = `SETU ALERT: ${elderName} has triggered an SOS. Please check the app or call them now.`;
  await Promise.all(familyPhones.map((phone) => sendSms(phone, body)));
}
