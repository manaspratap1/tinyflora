import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser, requireAdmin } from "@/lib/auth";
import { calculateCartSummary } from "@/app/api/cart/route";
import { getStoreSettings } from "@/lib/settings";

export async function GET(request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        items: true,
      },
    });
    return NextResponse.json({ orders, total: orders.length });
  } catch (error) {
    console.error("Get orders database error:", error);
    return NextResponse.json(
      { message: "Internal server error: Database service unavailable" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { items, customerName, customerEmail, customerPhone, shippingAddress } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Cannot place order with an empty cart" },
        { status: 400 }
      );
    }

    if (!customerName?.trim() || !customerEmail?.trim() || !shippingAddress?.trim()) {
      return NextResponse.json(
        { message: "Customer name, email, and shipping address are required" },
        { status: 400 }
      );
    }

    const user = getAuthUser(request);
    const userId = user ? user.userId : null;

    try {
      // Execute ACID transaction
      const order = await prisma.$transaction(async (tx) => {
        const productIds = items.map((i) => Number(i.id)).filter(Boolean);

        const dbProducts = await tx.product.findMany({
          where: {
            id: { in: productIds },
            isActive: true,
          },
        });

        const productMap = new Map(dbProducts.map((p) => [p.id, p]));
        const orderLineItems = [];

        for (const item of items) {
          const product = productMap.get(Number(item.id));
          if (!product) {
            throw new Error(`Product #${item.id} is no longer available`);
          }

          const requestedQty = Math.max(1, Number(item.quantity) || 1);
          if (product.stock < requestedQty) {
            throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
          }

          // Decrement inventory atomically
          await tx.product.update({
            where: { id: product.id },
            data: { stock: { decrement: requestedQty } },
          });

          orderLineItems.push({
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: requestedQty,
          });
        }

        const settings = await getStoreSettings();
        const { summary } = calculateCartSummary(orderLineItems, settings);
        const orderNumber = `TFG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const createdOrder = await tx.order.create({
          data: {
            orderNumber,
            userId,
            customerName: customerName.trim(),
            customerEmail: customerEmail.trim().toLowerCase(),
            customerPhone: customerPhone?.trim() || "",
            shippingAddress: shippingAddress.trim(),
            subtotal: summary.subtotal,
            shippingFee: summary.shippingFee,
            total: summary.total,
            status: "CONFIRMED",
            items: {
              create: orderLineItems.map((line) => ({
                productId: line.productId,
                name: line.name,
                price: line.price,
                quantity: line.quantity,
              })),
            },
          },
          include: {
            items: true,
          },
        });

        return createdOrder;
      });

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          total: Number(order.total),
          status: order.status,
          createdAt: order.createdAt,
        },
      }, { status: 201 });
    } catch (txError) {
      console.error("Order transaction error:", txError);
      return NextResponse.json(
        { message: txError.message || "Failed to complete order" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred during checkout" },
      { status: 500 }
    );
  }
}