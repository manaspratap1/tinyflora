import "dotenv/config";
import prisma from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/auth.js";

async function main() {
  console.log("🌱 Starting Tiny Flora database seed...");

  // 1. Seed Store Settings
  console.log("-> Seeding default store settings...");
  const existingSettings = await prisma.storeSettings.findFirst();
  if (!existingSettings) {
    await prisma.storeSettings.create({
      data: {
        storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Tiny Flora Microgreens",
        contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@tinyflora.com",
        contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91XXXXXXXXXX",
        whatsappNumber: "+91XXXXXXXXXX",
        address: process.env.NEXT_PUBLIC_STORE_ADDRESS || "Lucknow, Uttar Pradesh",
        instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
        facebookUrl: process.env.NEXT_PUBLIC_FACEBOOK_URL || "",
        deliveryCharge: 40.0,
        freeDeliveryThreshold: 499.0,
        currency: "INR",
        announcementText: "Fresh harvest available! Free local delivery over ₹499",
        businessHours: "Mon - Sat: 9:00 AM - 7:00 PM",
        minimumOrderAmount: 0.0,
        deliveryInformation: "Same-day harvest & delivery within 24-48 hours across the city.",
      },
    });
    console.log("   ✓ Store settings created");
  } else {
    console.log("   ✓ Store settings already exist");
  }

  // 2. Seed Admin Users
  console.log("-> Seeding admin user(s)...");
  const envAdminEmail = (process.env.ADMIN_EMAIL || "manas@gmail.com").trim().toLowerCase();
  const envAdminPassword = process.env.ADMIN_PASSWORD || "adbYVIUawo2375";
  const envAdminHash = await hashPassword(envAdminPassword);

  await prisma.user.upsert({
    where: { email: envAdminEmail },
    update: {
      role: "ADMIN",
      passwordHash: envAdminHash,
    },
    create: {
      email: envAdminEmail,
      passwordHash: envAdminHash,
      name: "Primary Admin",
      phone: "+91XXXXXXXXXX",
      role: "ADMIN",
    },
  });
  console.log(`   ✓ Admin user seeded: '${envAdminEmail}'`);

  // Also seed demo / demo for test convenience
  // const demoHash = await hashPassword("demo");
  // await prisma.user.upsert({
  //   where: { email: envAdminEmail },
  //   update: {
  //     role: "ADMIN",
  //     passwordHash: demoHash,
  //   },
  //   create: {
  //     email: "demo",
  //     passwordHash: demoHash,
  //     name: "Demo Admin",
  //     phone: "+91 98765 00000",
  //     role: "ADMIN",
  //   },
  // });
  // console.log("   ✓ Demo admin seeded: 'demo' / 'demo'");

  // 3. Seed 5 Categories
  console.log("-> Seeding 5 product categories...");
  const categoriesData = [
    {
      name: "Fresh Microgreens",
      description: "Nutrient-rich, crisp living greens harvested fresh daily for everyday culinary meals.",
    },
    {
      name: "Microgreen Mixes",
      description: "Chef-crafted medley blends combining spicy, peppery, crunchy, and tender varieties.",
    },
    {
      name: "Gourmet Herb Greens",
      description: "Aromatic micro-herbs, citrusy basils, tender micro cilantro, and edible floral greens.",
    },
    {
      name: "Grow Trays & Live Kits",
      description: "Living countertop grow trays and certified organic DIY microgreen starter kits for home harvesting.",
    },
    {
      name: "Organic Seeds & Supplies",
      description: "Certified non-GMO sprouting seeds, natural compressed coco coir grow pads, and misting tools.",
    },
  ];

  const categoryMap = {};
  for (const cat of categoriesData) {
    const saved = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
    categoryMap[cat.name] = saved.id;
  }
  console.log("   ✓ 5 Categories upserted successfully");

  // 4. Seed 22 Products across categories
  console.log("-> Seeding 22 catalog products...");
  const productsData = [
    // Category 1: Fresh Microgreens
    {
      name: "Sunflower Microgreens",
      categoryName: "Fresh Microgreens",
      description: "Fresh, crisp microgreens with a rich nutty crunch and succulent texture for salads, sandwiches, and daily juices.",
      price: 99.0,
      weight: "50g",
      stock: 45,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700",
    },
    {
      name: "Radish Microgreens",
      categoryName: "Fresh Microgreens",
      description: "A vibrant peppery green with bright purple stems that delivers a zesty kick to avocado toast and grain bowls.",
      price: 89.0,
      weight: "50g",
      stock: 35,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700",
    },
    {
      name: "Broccoli Microgreens",
      categoryName: "Fresh Microgreens",
      description: "Tender, antioxidant-dense greens packed with concentrated sulforaphane vitamins and a mild, clean flavor.",
      price: 109.0,
      weight: "50g",
      stock: 30,
      isFeatured: true,
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700",
    },
    {
      name: "Tender Pea Shoots",
      categoryName: "Fresh Microgreens",
      description: "Sweet, leafy green tendrils with a distinctive tender snap and delicate sugar-snap pea sweetness.",
      price: 119.0,
      weight: "75g",
      stock: 25,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700",
    },
    {
      name: "Red Garnet Amaranth",
      categoryName: "Fresh Microgreens",
      description: "Striking magenta-red leaves with a mild, earthy spinach-like sweetness favored by fine dining chefs.",
      price: 129.0,
      weight: "40g",
      stock: 20,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=700",
    },
    {
      name: "Zesty Arugula Microgreens",
      categoryName: "Fresh Microgreens",
      description: "Nutty and peppery with intense rocket flavor, ideal for pairing with gourmet cheese, pizzas, and pasta.",
      price: 95.0,
      weight: "50g",
      stock: 28,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700",
    },
    {
      name: "Sweet Purple Kohlrabi",
      categoryName: "Fresh Microgreens",
      description: "Stunning violet stems topped with emerald green cotyledons, delivering a sweet, mild cabbage essence.",
      price: 99.0,
      weight: "50g",
      stock: 22,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700",
    },
    {
      name: "Organic Wheatgrass (Living Flat)",
      categoryName: "Fresh Microgreens",
      description: "Pure chlorophyll powerhouse for invigorating morning shots, freshly harvested or kept living on tray.",
      price: 149.0,
      weight: "100g",
      stock: 18,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700",
    },

    // Category 2: Microgreen Mixes
    {
      name: "Spicy Salad Medley",
      categoryName: "Microgreen Mixes",
      description: "A zesty combination of mustard, radish, and arugula microgreens creating an instant gourmet salad topping.",
      price: 139.0,
      weight: "80g",
      stock: 24,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1505253758473-96b46deae2cd?w=700",
    },
    {
      name: "Gentle Sweet Blend",
      categoryName: "Microgreen Mixes",
      description: "Child-friendly, mellow blend of sunflower, broccoli, and sweet pea greens for smoothies and wraps.",
      price: 139.0,
      weight: "80g",
      stock: 30,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700",
    },
    {
      name: "Rainbow Crunch Superfood Mix",
      categoryName: "Microgreen Mixes",
      description: "Vibrant visual mix of red amaranth, purple radish, and green sunflower greens offering diverse micronutrients.",
      price: 159.0,
      weight: "90g",
      stock: 26,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700",
    },
    {
      name: "Vitality Detox Mix",
      categoryName: "Microgreen Mixes",
      description: "Specially formulated blend of broccoli, kale, and alfalfa microgreens for daily immune-boosting nutrition.",
      price: 149.0,
      weight: "85g",
      stock: 20,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=700",
    },

    // Category 3: Gourmet Herb Greens
    {
      name: "Lemon Basil Microgreens",
      categoryName: "Gourmet Herb Greens",
      description: "Intensely fragrant basil leaves infused with a sharp citrus aroma, perfect for pesto and mocktails.",
      price: 119.0,
      weight: "40g",
      stock: 18,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=700",
    },
    {
      name: "Micro Cilantro (Coriander)",
      categoryName: "Gourmet Herb Greens",
      description: "Delicate feather-like leaves with a concentrated, sweet cilantro punch for street tacos, curries, and chaats.",
      price: 99.0,
      weight: "40g",
      stock: 25,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700",
    },
    {
      name: "Gourmet Nasturtium Leaves",
      categoryName: "Gourmet Herb Greens",
      description: "Lily-pad shaped miniature leaves with a horseradish-like peppery snap, stunning on seafood and carpaccio.",
      price: 149.0,
      weight: "35g",
      stock: 15,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700",
    },
    {
      name: "Purple Shiso Microgreens",
      categoryName: "Gourmet Herb Greens",
      description: "Exotic Japanese herb featuring deep crimson frills and complex notes of anise, cinnamon, and mint.",
      price: 159.0,
      weight: "35g",
      stock: 12,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700",
    },

    // Category 4: Grow Trays & Live Kits
    {
      name: "Living Countertop Sunflower Tray",
      categoryName: "Grow Trays & Live Kits",
      description: "A living root tray of sunflower microgreens to keep on your dining table. Snip fresh greens as you eat!",
      price: 249.0,
      weight: "1 Living Tray",
      stock: 20,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700",
    },
    {
      name: "DIY Organic Microgreens Starter Kit",
      categoryName: "Grow Trays & Live Kits",
      description: "Complete home kit includes 3 seed varieties, reusable bamboo tray, coco soil pads, and step-by-step grow guide.",
      price: 499.0,
      weight: "1 Complete Kit",
      stock: 35,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=700",
    },
    {
      name: "Bamboo Windowsill Micro-Farm Kit",
      categoryName: "Grow Trays & Live Kits",
      description: "Modern aesthetic wooden windowsill farm that fits any kitchen window, supporting up to 2 simultaneous harvest cycles.",
      price: 699.0,
      weight: "1 Wooden Kit",
      stock: 14,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1505253758473-96b46deae2cd?w=700",
    },

    // Category 5: Organic Seeds & Supplies
    {
      name: "Non-GMO 5-Variety Seed Collection",
      categoryName: "Organic Seeds & Supplies",
      description: "High germination rate certified non-GMO seed packets: Sunflower, Radish, Broccoli, Pea, and Arugula.",
      price: 299.0,
      weight: "150g Total Seeds",
      stock: 50,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700",
    },
    {
      name: "Organic Coco Coir Grow Mats (Pack of 10)",
      categoryName: "Organic Seeds & Supplies",
      description: "Clean, odorless, hydro-retaining natural coconut fiber pads tailored to fit standard kitchen microgreen trays.",
      price: 199.0,
      weight: "10 Mats",
      stock: 60,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700",
    },
    {
      name: "Amber Glass Fine Mist Plant Sprayer",
      categoryName: "Organic Seeds & Supplies",
      description: "Durable 250ml ultraviolet glass spray bottle providing ultra-fine misting for fragile emerging microgreens.",
      price: 149.0,
      weight: "250ml Sprayer",
      stock: 40,
      isFeatured: false,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700",
    },
  ];

  let addedCount = 0;
  let updatedCount = 0;

  for (const item of productsData) {
    const categoryId = categoryMap[item.categoryName];
    if (!categoryId) continue;

    const existing = await prisma.product.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: item.description,
          price: item.price,
          weight: item.weight,
          stock: item.stock,
          isFeatured: item.isFeatured,
          image: item.image,
          categoryId: categoryId,
        },
      });
      updatedCount++;
    } else {
      await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          weight: item.weight,
          stock: item.stock,
          isFeatured: item.isFeatured,
          image: item.image,
          categoryId: categoryId,
        },
      });
      addedCount++;
    }
  }

  console.log(`   ✓ Products processed: ${addedCount} created, ${updatedCount} updated (${productsData.length} total)`);
  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
