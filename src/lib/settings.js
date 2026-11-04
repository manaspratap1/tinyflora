import prisma from "@/lib/prisma";

export const DEFAULT_STORE_SETTINGS = {
  storeName: "Tiny Flora Microgreens",
  contactEmail: "hello@tinyflora.com",
  contactPhone: "+91XXXXXXXXXX",
  whatsappNumber: "+91XXXXXXXXXX",
  address: "Lucknow, Uttar Pradesh",
  instagramUrl: "",
  facebookUrl: "",
  deliveryCharge: 40,
  freeDeliveryThreshold: 499,
  currency: "INR",
  announcementText: "Fresh harvest available!",
  businessHours: "Mon - Sat: 9:00 AM - 7:00 PM",
  minimumOrderAmount: 0,
  deliveryInformation: "Same-day harvest & delivery within 24-48 hours.",
};

export async function getStoreSettings() {
  try {
    const settings = await prisma.storeSettings.findFirst();
    if (settings) {
      return {
        id: settings.id,
        storeName: settings.storeName || DEFAULT_STORE_SETTINGS.storeName,
        contactEmail: settings.contactEmail || DEFAULT_STORE_SETTINGS.contactEmail,
        contactPhone: settings.contactPhone || DEFAULT_STORE_SETTINGS.contactPhone,
        whatsappNumber: settings.whatsappNumber || DEFAULT_STORE_SETTINGS.whatsappNumber,
        address: settings.address || DEFAULT_STORE_SETTINGS.address,
        instagramUrl: settings.instagramUrl || "",
        facebookUrl: settings.facebookUrl || "",
        deliveryCharge: Number(settings.deliveryCharge ?? DEFAULT_STORE_SETTINGS.deliveryCharge),
        freeDeliveryThreshold: Number(settings.freeDeliveryThreshold ?? DEFAULT_STORE_SETTINGS.freeDeliveryThreshold),
        currency: settings.currency || DEFAULT_STORE_SETTINGS.currency,
        announcementText: settings.announcementText || DEFAULT_STORE_SETTINGS.announcementText,
        businessHours: settings.businessHours || DEFAULT_STORE_SETTINGS.businessHours,
        minimumOrderAmount: Number(settings.minimumOrderAmount ?? DEFAULT_STORE_SETTINGS.minimumOrderAmount),
        deliveryInformation: settings.deliveryInformation || DEFAULT_STORE_SETTINGS.deliveryInformation,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      };
    }
  } catch {
    // Database table may not be migrated yet or connection unavailable
  }
  return DEFAULT_STORE_SETTINGS;
}

