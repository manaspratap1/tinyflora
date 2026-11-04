import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, createToken, isHttpsRequest } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : null;

    if (!name || name.length > 120) {
      return NextResponse.json(
        { message: "A valid name is required (max 120 characters)" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { message: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    try {
      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        return NextResponse.json(
          { message: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          phone,
          role: "CUSTOMER",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      const token = createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const response = NextResponse.json(
        { user, message: "Account created successfully" },
        { status: 201 }
      );

      const isSecure = isHttpsRequest(request);

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: isSecure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    } catch (dbError) {
      console.warn("Database offline during signup:", dbError.message);
      return NextResponse.json(
        { message: "Database server is not reachable to register new accounts. Please ensure PostgreSQL is running." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during signup" },
      { status: 500 }
    );
  }
}