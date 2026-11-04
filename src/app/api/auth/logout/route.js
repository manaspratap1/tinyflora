import { NextResponse } from "next/server";
import { isHttpsRequest } from "@/lib/auth";

export async function POST(request) {
  const response = NextResponse.json({
    message: "Logged out successfully",
  });

  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: isHttpsRequest(request),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}