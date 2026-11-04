import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// PATCH: Update category (ADMIN ONLY)
export async function PATCH(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const categoryId = Number(id);
    const body = await request.json();

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const data = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }

    if (typeof body.description === "string" || body.description === null) {
      data.description = body.description?.trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return NextResponse.json(category);
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { message: "Category name already exists" },
        { status: 409 }
      );
    }

    console.error(error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE: Delete category (ADMIN ONLY)
export async function DELETE(request, { params }) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const categoryId = Number(id);

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    if (category._count.products > 0) {
      return NextResponse.json(
        { message: "Cannot delete a category containing products" },
        { status: 409 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}