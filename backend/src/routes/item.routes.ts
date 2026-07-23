import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();
router.get("/", async (req, res) => {
  console.log("RECEIVED GET /api/items REQUEST");
  try {
    const items = await prisma.item.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("Found items:", items.length);
    return res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ error: "Failed to fetch items" });
  }
});

export default router;
