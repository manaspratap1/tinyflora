import prisma from "../src/lib/prisma.js";

async function main() {
  const categories = await prisma.category.findMany();

  console.log("Database connected successfully!");
  console.log("Categories:", categories);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });