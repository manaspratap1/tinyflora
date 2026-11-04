import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(request) {
  const user = getAuthUser(request);

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}