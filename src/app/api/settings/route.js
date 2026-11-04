import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings, DEFAULT_STORE_SETTINGS } from "@/lib/settings";

// GET: Fetch store details & dynamic delivery charges (Public)
export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(DEFAULT_STORE_SETTINGS);
  }
}

// PATCH: Update store settings (ADMIN ONLY)
export async function PATCH(request) {
  const admin = requireAdmin(request);
  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized. Admin privileges required." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = {};

    if (typeof body.storeName === "string") data.storeName = body.storeName.trim();
    if (typeof body.contactEmail === "string") data.contactEmail = body.contactEmail.trim().toLowerCase();
    if (typeof body.contactPhone === "string") data.contactPhone = body.contactPhone.trim();
    if (typeof body.whatsappNumber === "string") data.whatsappNumber = body.whatsappNumber.trim();
    if (typeof body.address === "string") data.address = body.address.trim();
    if (typeof body.instagramUrl === "string") data.instagramUrl = body.instagramUrl.trim();
    if (typeof body.facebookUrl === "string") data.facebookUrl = body.facebookUrl.trim();
    if (body.deliveryCharge !== undefined) data.deliveryCharge = Math.max(0, Number(body.deliveryCharge));
    if (body.freeDeliveryThreshold !== undefined) data.freeDeliveryThreshold = Math.max(0, Number(body.freeDeliveryThreshold));
    if (typeof body.currency === "string") data.currency = body.currency.trim();
    if (typeof body.announcementText === "string") data.announcementText = body.announcementText.trim();
    if (typeof body.businessHours === "string") data.businessHours = body.businessHours.trim();
    if (body.minimumOrderAmount !== undefined) data.minimumOrderAmount = Math.max(0, Number(body.minimumOrderAmount));
    if (typeof body.deliveryInformation === "string") data.deliveryInformation = body.deliveryInformation.trim();

    const existing = await prisma.storeSettings.findFirst();

    let updated;
    if (existing) {
      updated = await prisma.storeSettings.update({
        where: { id: existing.id },
        data,
      });
    } else {
      updated = await prisma.storeSettings.create({
        data: {
          ...DEFAULT_STORE_SETTINGS,
          ...data,
        },
      });
    }

    return NextResponse.json({
      ...updated,
      deliveryCharge: Number(updated.deliveryCharge),
      freeDeliveryThreshold: Number(updated.freeDeliveryThreshold),
      minimumOrderAmount: Number(updated.minimumOrderAmount),
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { message: "Internal server error: Failed to update store settings" },
      { status: 500 }
    );
  }
}

