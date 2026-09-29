import { prisma } from "./prisma";
import type { SessionPayload } from "./auth";

/** True if this session may read/write data belonging to `elderId`. */
export async function canAccessElder(session: SessionPayload, elderId: string): Promise<boolean> {
  if (session.role === "ADMIN") return true;
  if (session.role === "ELDER") return session.userId === elderId;
  if (session.role === "FAMILY") {
    const link = await prisma.familyLink.findUnique({
      where: { familyId_elderId: { familyId: session.userId, elderId } },
    });
    return !!link;
  }
  if (session.role === "CAREGIVER") {
    const visit = await prisma.visit.findFirst({ where: { elderId, caregiverId: session.userId } });
    return !!visit;
  }
  return false;
}
