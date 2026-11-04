import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const productSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  weight: true,
  image: true,
  stock: true,
  isActive: true,
  categoryId: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
};

// GET: Fetch one product (Public)
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isActive: true,
      },
      select: productSelect,
    });

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PATCH: Update product / stock (ADMIN ONLY)
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
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 150
      ) {
        return NextResponse.json(
          { message: "Invalid product name" },
          { status: 400 }
        );
      }
      data.name = body.name.trim();
    }

    if (body.description !== undefined) {
      data.description =
        typeof body.description === "string" && body.description.trim()
          ? body.description.trim()
          : null;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { message: "Price must be greater than zero" },
          { status: 400 }
        );
      }
      data.price = price;
    }

    if (body.stock !== undefined) {
      const stock = Number(body.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        return NextResponse.json(
          { message: "Stock must be a non-negative integer" },
          { status: 400 }
        );
      }
      data.stock = stock;
    }

    if (body.categoryId !== undefined) {
      const categoryId = Number(body.categoryId);
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return NextResponse.json(
          { message: "Invalid category ID" },
          { status: 400 }
        );
      }
      data.categoryId = categoryId;
    }

    for (const field of ["weight", "image"]) {
      if (body[field] !== undefined) {
        data[field] =
          typeof body[field] === "string" && body[field].trim()
            ? body[field].trim()
            : null;
      }
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { message: "isActive must be a boolean" },
          { status: 400 }
        );
      }
      data.isActive = body.isActive;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      select: productSelect,
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    if (error.code === "P2003") {
      return NextResponse.json(
        { message: "Selected category does not exist" },
        { status: 400 }
      );
    }

    console.error("Update product database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE: Delete product (ADMIN ONLY)
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
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { message: "Invalid product ID" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    console.error("Delete product database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Failed to delete product" },
      { status: 500 }
    );
  }
}