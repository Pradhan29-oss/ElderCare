// Compatibility shim: dashboard pages were originally written against an
// in-memory lowdb JSON blob. Rather than rewrite every filter/find call in
// those pages, this re-assembles the same shape from Postgres via Prisma.
// New code should query `prisma` directly (see src/lib/prisma.ts) — this
// file exists only for the four dashboard/*/page.tsx server components.
import { prisma } from "./prisma";

export type Role = "ADMIN" | "FAMILY" | "ELDER" | "CAREGIVER";

export interface User {
  id: string;
  name: string;
  phone: string;
  password: string;
  role: Role;
  city?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  language?: string | null;
  rating?: number | null;
  verified?: boolean;
}

export interface FamilyLink {
  id: string;
  familyId: string;
  elderId: string;
  relation: string;
  isPrimary: boolean;
}

export interface Visit {
  id: string;
  elderId: string;
  caregiverId: string | null;
  serviceType: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: "SCHEDULED" | "CAREGIVER_DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes: string | null;
}

export interface Alert {
  id: string;
  elderId: string;
  source: string;
  status: "TRIGGERED" | "CAREGIVER_ASSIGNED" | "RESOLVED" | "FALSE_ALARM";
  triggeredAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;
}

export interface Vital {
  id: string;
  elderId: string;
  type: "BLOOD_PRESSURE" | "HEART_RATE" | "BLOOD_OXYGEN" | "WEIGHT" | "BLOOD_SUGAR";
  value: string;
  timestamp: string;
}

export interface Medicine {
  id: string;
  elderId: string;
  name: string;
  time: string;
  taken: boolean;
  lastTakenDate: string | null;
}

export interface CaregiverMeta {
  id: string;
  activeVisitId: string | null;
  onDuty: boolean;
}

export interface DBShape {
  users: User[];
  familyLinks: FamilyLink[];
  visits: Visit[];
  alerts: Alert[];
  vitals: Vital[];
  medicines: Medicine[];
  caregivers: CaregiverMeta[];
}

export async function readDb(): Promise<DBShape> {
  const [users, familyLinks, visits, alerts, vitals, medicines, caregiverMetas] = await Promise.all([
    prisma.user.findMany(),
    prisma.familyLink.findMany(),
    prisma.visit.findMany(),
    prisma.alert.findMany(),
    prisma.vital.findMany(),
    prisma.medicine.findMany(),
    prisma.caregiverMeta.findMany(),
  ]);

  return {
    users,
    familyLinks,
    visits: visits.map((v) => ({
      ...v,
      scheduledStart: v.scheduledStart.toISOString(),
      scheduledEnd: v.scheduledEnd.toISOString(),
    })),
    alerts: alerts.map((a) => ({
      ...a,
      triggeredAt: a.triggeredAt.toISOString(),
      resolvedAt: a.resolvedAt ? a.resolvedAt.toISOString() : null,
    })),
    vitals: vitals.map((v) => ({ ...v, timestamp: v.timestamp.toISOString() })),
    medicines,
    caregivers: caregiverMetas.map((c) => ({ id: c.userId, activeVisitId: c.activeVisitId, onDuty: c.onDuty })),
  };
}
