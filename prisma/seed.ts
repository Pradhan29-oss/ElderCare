import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to create public demo accounts in production.");
  }

  const admin = await prisma.user.upsert({
    where: { phone: "9800000001" },
    update: {},
    create: {
      name: "Priya Nair",
      phone: "9800000001",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  const family = await prisma.user.upsert({
    where: { phone: "9800000002" },
    update: {},
    create: {
      name: "Rohan Mehta",
      phone: "9800000002",
      password: await bcrypt.hash("family123", 10),
      role: "FAMILY",
      city: "San Francisco, USA",
    },
  });

  const elder = await prisma.user.upsert({
    where: { phone: "9800000003" },
    update: {},
    create: {
      name: "Lakshmi Mehta",
      phone: "9800000003",
      password: await bcrypt.hash("elder123", 10),
      role: "ELDER",
      city: "Guwahati, Assam",
      dob: "1952-03-14",
      bloodGroup: "B+",
      language: "Assamese",
    },
  });

  const caregiver = await prisma.user.upsert({
    where: { phone: "9800000004" },
    update: {},
    create: {
      name: "Anjali Das",
      phone: "9800000004",
      password: await bcrypt.hash("care123", 10),
      role: "CAREGIVER",
      city: "Guwahati, Assam",
      rating: 4.8,
      verified: true,
    },
  });

  await prisma.caregiverMeta.upsert({
    where: { userId: caregiver.id },
    update: { onDuty: true },
    create: { userId: caregiver.id, onDuty: true },
  });

  await prisma.familyLink.upsert({
    where: { familyId_elderId: { familyId: family.id, elderId: elder.id } },
    update: {},
    create: { familyId: family.id, elderId: elder.id, relation: "Son", isPrimary: true },
  });

  const existingVisits = await prisma.visit.count();
  if (existingVisits === 0) {
    await prisma.visit.create({
      data: {
        elderId: elder.id,
        caregiverId: caregiver.id,
        serviceType: "WELLNESS",
        scheduledStart: new Date("2026-07-05T04:00:00.000Z"),
        scheduledEnd: new Date("2026-07-05T05:00:00.000Z"),
        status: "SCHEDULED",
      },
    });
  }

  const existingMeds = await prisma.medicine.count();
  if (existingMeds === 0) {
    await prisma.medicine.createMany({
      data: [
        { elderId: elder.id, name: "Amlodipine 5mg", time: "08:00", taken: true, lastTakenDate: "2026-07-04" },
        { elderId: elder.id, name: "Metformin 500mg", time: "13:00", taken: false },
        { elderId: elder.id, name: "Vitamin D3", time: "20:00", taken: false },
      ],
    });
  }

  const existingVitals = await prisma.vital.count();
  if (existingVitals === 0) {
    await prisma.vital.createMany({
      data: [
        { elderId: elder.id, type: "HEART_RATE", value: "76" },
        { elderId: elder.id, type: "BLOOD_OXYGEN", value: "97" },
        { elderId: elder.id, type: "BLOOD_PRESSURE", value: "128/82" },
      ],
    });
  }

  console.log("Seed complete:", { admin: admin.phone, family: family.phone, elder: elder.phone, caregiver: caregiver.phone });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
