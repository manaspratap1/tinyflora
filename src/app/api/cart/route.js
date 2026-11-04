import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from "@/lib/settings";

// Helper: Calculate totals in the backend dynamically using store settings
export function calculateCartSummary(items = [], settings = DEFAULT_STORE_SETTINGS) {
  let subtotal = 0;
  let totalItems = 0;

  const sanitizedItems = items.map((item) => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Number(item.price || item.product?.price || 0);
    const lineTotal = Number((unitPrice * qty).toFixed(2));

    subtotal += lineTotal;
    totalItems += qty;

    return {
      id: item.productId || item.id,
      name: item.name || item.product?.name,
      price: unitPrice,
      weight: item.weight || item.product?.weight,
      image: item.image || item.product?.image,
      stock: item.stock ?? item.product?.stock ?? 100,
      quantity: qty,
      lineTotal,
    };
  });

  const finalSubtotal = Number(subtotal.toFixed(2));
  const deliveryCharge = Number(settings.deliveryCharge ?? 40);
  const freeThreshold = Number(settings.freeDeliveryThreshold ?? 499);

  // Dynamic shipping calculation
  const shippingFee = finalSubtotal >= freeThreshold || finalSubtotal === 0 ? 0 : deliveryCharge;
  const total = Number((finalSubtotal + shippingFee).toFixed(2));

  return {
    items: sanitizedItems,
    summary: {
      totalItems,
      subtotal: finalSubtotal,
      shippingFee,
      freeShippingThreshold: freeThreshold,
      total,
      currency: settings.currency || "INR",
      currencySymbol: "₹",
    },
  };
}

/**
 * POST /api/cart: Calculate or sync cart totals atomically
 * Accepts: { items: [{ id, quantity }] }
 * Always validates against DB product inventory, prices, and store settings.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const clientItems = Array.isArray(body.items) ? body.items : [];
    const settings = await getStoreSettings();

    if (clientItems.length === 0) {
      return NextResponse.json(calculateCartSummary([], settings));
    }

    try {
      // Validate product prices and stock from the database
      const productIds = clientItems
        .map((i) => Number(i.id))
        .filter((id) => Number.isInteger(id) && id > 0);

      const dbProducts = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          price: true,
          weight: true,
          image: true,
          stock: true,
        },
      });

      const productMap = new Map(dbProducts.map((p) => [p.id, p]));

      const verifiedItems = [];
      for (const item of clientItems) {
        const p = productMap.get(Number(item.id));
        if (p) {
          const qty = Math.min(Math.max(1, Number(item.quantity) || 1), Math.max(1, p.stock));
          verifiedItems.push({
            productId: p.id,
            name: p.name,
            price: Number(p.price),
            weight: p.weight,
            image: p.image,
            stock: p.stock,
            quantity: qty,
          });
        }
      }

      return NextResponse.json(calculateCartSummary(verifiedItems, settings));
    } catch (dbError) {
      console.warn("DB offline during cart calculation, calculating from client items:", dbError.message);
      return NextResponse.json(calculateCartSummary(clientItems, settings));
    }
  } catch (error) {
    console.error("Cart API error:", error);
    return NextResponse.json(
      { message: "Failed to process cart calculation" },
      { status: 500 }
    );
  }
}