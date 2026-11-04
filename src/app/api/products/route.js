import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const SORT_FIELDS = ["name", "price", "createdAt"];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit")) || 12)
    );

    const search = searchParams.get("search")?.trim() || "";
    const categoryIdParam = searchParams.get("categoryId");
    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = searchParams.get("sortOrder") || "desc";
    const activeParam = searchParams.get("isActive");

    if (
      categoryIdParam &&
      (!Number.isInteger(Number(categoryIdParam)) ||
        Number(categoryIdParam) <= 0)
    ) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const minPrice = minPriceParam === null ? undefined : Number(minPriceParam);
    const maxPrice = maxPriceParam === null ? undefined : Number(maxPriceParam);

    if (
      (minPrice !== undefined && (!Number.isFinite(minPrice) || minPrice < 0)) ||
      (maxPrice !== undefined && (!Number.isFinite(maxPrice) || maxPrice < 0)) ||
      (minPrice !== undefined &&
        maxPrice !== undefined &&
        minPrice > maxPrice)
    ) {
      return NextResponse.json(
        { message: "Invalid price range" },
        { status: 400 }
      );
    }

    if (!SORT_FIELDS.includes(sortByParam)) {
      return NextResponse.json(
        { message: "Invalid sort field" },
        { status: 400 }
      );
    }

    if (!["asc", "desc"].includes(sortOrderParam)) {
      return NextResponse.json(
        { message: "Invalid sort order" },
        { status: 400 }
      );
    }

    const where = {
      ...(activeParam !== "all" && {
        isActive: activeParam === "false" ? false : true,
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(categoryIdParam && {
        categoryId: Number(categoryIdParam),
      }),
      ...((minPrice !== undefined || maxPrice !== undefined) && {
        price: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }),
    };

    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        select: {
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
        },
        orderBy: [
          { [sortByParam]: sortOrderParam },
          { id: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get products database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Database service unavailable" },
      { status: 500 }
    );
  }
}

// POST: Add new product (ADMIN ONLY)
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

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock ?? 0);
    const categoryId = Number(body.categoryId);

    if (!name || name.length > 150) {
      return NextResponse.json(
        { message: "Product name is required (maximum 150 characters)" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { message: "Price must be greater than zero" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { message: "Stock must be a non-negative integer" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { message: "A valid category is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: body.description?.trim() || null,
        price,
        weight: body.weight?.trim() || null,
        image: body.image?.trim() || null,
        stock,
        isActive: body.isActive ?? true,
        categoryId,
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
        categoryId: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error.code === "P2003") {
      return NextResponse.json(
        { message: "Selected category does not exist" },
        { status: 400 }
      );
    }

    console.error("Create product database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Failed to create product" },
      { status: 500 }
    );
  }
}