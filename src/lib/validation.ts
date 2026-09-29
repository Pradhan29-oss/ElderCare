import { z } from "zod";

// India-friendly phone: 10 digits, optionally prefixed with +91
const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number")
  .transform((v) => v.replace(/^\+91/, ""));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  phone: phoneSchema,
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
  role: z.enum(["FAMILY", "CAREGIVER"]), // ADMIN/ELDER can never be self-assigned
  city: z.string().trim().max(200).optional().or(z.literal("")),
  elderName: z.string().trim().max(100).optional(),
  elderPhone: phoneSchema.optional().or(z.literal("")),
  relation: z.string().trim().max(50).optional(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export const bookVisitSchema = z.object({
  elderId: z.string().min(1),
  serviceType: z.enum([
    "WELLNESS",
    "GROCERY",
    "BANKING",
    "GOVERNMENT_OFFICE",
    "COMPANIONSHIP",
    "HOSPITAL_COMPANION",
    "RELIGIOUS_SOCIAL",
  ]),
  scheduledStart: z.string().datetime().or(z.string().min(1)),
  scheduledEnd: z.string().datetime().or(z.string().min(1)),
});

export const alertCreateSchema = z.object({
  elderId: z.string().min(1).optional(),
  source: z.enum(["SOS_BUTTON", "FALL_DETECTION", "WEARABLE_HEART_RATE"]).optional(),
});

export const alertUpdateSchema = z.object({
  status: z.enum(["TRIGGERED", "CAREGIVER_ASSIGNED", "RESOLVED", "FALSE_ALARM"]).optional(),
  resolutionNotes: z.string().max(1000).optional(),
});

export const medicineCreateSchema = z.object({
  elderId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(200),
  time: z.string().trim().min(1).max(20),
});

export const medicineUpdateSchema = z.object({
  taken: z.boolean().optional(),
  lastTakenDate: z.string().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  time: z.string().trim().min(1).max(20).optional(),
});

export const vitalCreateSchema = z.object({
  elderId: z.string().min(1).optional(),
  type: z.enum(["BLOOD_PRESSURE", "HEART_RATE", "BLOOD_OXYGEN", "WEIGHT", "BLOOD_SUGAR"]),
  value: z.string().trim().min(1).max(50),
});

export const visitUpdateSchema = z.object({
  status: z.enum(["SCHEDULED", "CAREGIVER_DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().max(2000).optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
});

/** Formats the first Zod error into a short, user-facing string. */
export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message || "Invalid input.";
}
