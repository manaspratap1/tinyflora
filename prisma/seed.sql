-- Seed Categories
INSERT INTO "category" ("id", "name", "description", "createdAt", "updatedAt")
VALUES
  (1, 'Fresh Microgreens', 'Nutrient-rich, crisp microgreens grown for everyday meals.', NOW(), NOW()),
  (2, 'Microgreen Mixes', 'A vibrant medley of complementary flavours and colours.', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed Products
INSERT INTO "product" ("id", "name", "description", "price", "weight", "image", "stock", "isActive", "categoryId", "createdAt", "updatedAt")
VALUES
  (1, 'Sunflower Microgreens', 'Fresh, crisp microgreens with a nutty crunch for everyday meals.', 99.00, '50g', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=700', 35, true, 1, NOW(), NOW()),
  (2, 'Radish Microgreens', 'A vibrant, peppery addition to bring zip to salads and sandwiches.', 89.00, '50g', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700', 25, true, 1, NOW(), NOW()),
  (3, 'Broccoli Microgreens', 'Tender, antioxidant-dense greens with a mild, fresh flavour.', 109.00, '50g', 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=700', 20, true, 1, NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- Seed Admin User (email: demo, password: demo)
INSERT INTO "users" ("email", "passwordHash", "name", "phone", "role", "createdAt", "updatedAt")
VALUES
  ('demo', '9b383a763fc3be4083c481ef85b85c8b:84e5ace05e956b4589b10913d98baeaec1f641672fc0a4dcea0034c1f839004769f7f138cb1486e0f76a2a03f2c851392cc8e992599fd92eefa55cbac1f78e2f', 'Store Admin', '+91 98765 00000', 'ADMIN', NOW(), NOW())
ON CONFLICT ("email") DO UPDATE SET "role" = 'ADMIN', "passwordHash" = EXCLUDED."passwordHash";

-- Reset autoincrement sequences
SELECT setval(pg_get_serial_sequence('category', 'id'), COALESCE(MAX(id), 1)) FROM "category";
SELECT setval(pg_get_serial_sequence('product', 'id'), COALESCE(MAX(id), 1)) FROM "product";