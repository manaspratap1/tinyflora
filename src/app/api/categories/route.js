import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET: Fetch all categories (Public)
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Get categories database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Database service unavailable" },
      { status: 500 }
    );
  }
}

// POST: Create a category (ADMIN ONLY)
export async function POST(request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
    }

    try {
      const category = await prisma.category.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
        },
      });

      return NextResponse.json(category, { status: 201 });
    } catch (dbError) {
      if (dbError.code === "P2002") {
        return NextResponse.json(
          { message: "Category already exists" },
          { status: 409 }
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { message: "Internal server error: Failed to create category" },
      { status: 500 }
    );
  }
}