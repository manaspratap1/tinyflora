import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = createToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      const response = NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    } catch (dbError) {
      // In offline development or when DB server is not reachable
      console.warn("Database offline during login, checking demo credentials fallback:", dbError.message);
      if (email === "demo" && password === "demo") {
        const token = createToken({
          userId: 1,
          email: "demo",
          name: "Store Admin",
          role: "ADMIN",
        });

        const response = NextResponse.json({
          user: {
            id: 1,
            name: "Store Admin",
            email: "demo",
            role: "ADMIN",
          },
        });

        response.cookies.set("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }

      return NextResponse.json(
        { message: "Database server is not reachable. You can test admin login with demo / demo." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}