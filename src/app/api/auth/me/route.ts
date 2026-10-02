import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const safe = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    city: user.city,
    dob: user.dob,
    bloodGroup: user.bloodGroup,
    language: user.language,
    rating: user.rating,
    verified: user.verified,
    createdAt: user.createdAt,
  };
  return NextResponse.json({ user: safe });
}
