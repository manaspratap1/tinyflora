/*
  Warnings:

  - You are about to drop the column `slug` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "category_slug_key";

-- DropIndex
DROP INDEX "product_slug_key";

-- AlterTable
ALTER TABLE "category" DROP COLUMN "slug";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "slug";
