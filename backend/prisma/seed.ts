import {PrismaClient} from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("seeding categories");

    const categories = [
      { name: "Electronics", slug: "electronics", icon: "laptop" },
      { name: "Vehicles", slug: "vehicles", icon: "car" },
      { name: "Fashion & Apparel", slug: "fashion", icon: "shirt" },
      { name: "Home & Furniture", slug: "home", icon: "home" },
      { name: "Books & Notes", slug: "books", icon: "book" },
      { name: "Sports & Hobbies", slug: "sports", icon: "activity" },
    ];

    for (const category of categories){
        await prisma.category.upsert({
            where: { slug : category.slug},
            update: {},
            create : category,
        })
    };

    console.log("seeding complete");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
});