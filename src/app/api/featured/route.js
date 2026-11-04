import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    let featured = await prisma.product.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        weight: true,
        image: true,
        stock: true,
        isActive: true,
        isFeatured: true,
        category: {
          select: { id: true, name: true },
        },
      },
      take: 3,
    });

    // If fewer than 3 are explicitly flagged, backfill with active products
    if (featured.length < 3) {
      const existingIds = featured.map((p) => p.id);
      const fillers = await prisma.product.findMany({
        where: {
          isActive: true,
          id: { notIn: existingIds },
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          weight: true,
          image: true,
          stock: true,
          isActive: true,
          isFeatured: true,
          category: {
            select: { id: true, name: true },
          },
        },
        take: 3 - featured.length,
      });
      featured = [...featured, ...fillers];
    }

    return NextResponse.json(featured);
  } catch (error) {
    console.error("Get featured products database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Database service unavailable" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0 || productIds.length > 3) {
      return NextResponse.json(
        { message: "You must provide an array of 1 to 3 product IDs" },
        { status: 400 }
      );
    }

    const cleanIds = productIds.map(Number).filter((id) => Number.isInteger(id) && id > 0);

    if (cleanIds.length !== productIds.length) {
      return NextResponse.json(
        { message: "Invalid product IDs provided" },
        { status: 400 }
      );
    }

    // Atomically update: reset all featured, then set chosen ones
    await prisma.$transaction([
      prisma.product.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      }),
      prisma.product.updateMany({
        where: { id: { in: cleanIds } },
        data: { isFeatured: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      featuredIds: cleanIds,
      message: "Featured products updated successfully",
    });
  } catch (error) {
    console.error("Update featured products database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Failed to update featured products" },
      { status: 500 }
    );
  }
}

