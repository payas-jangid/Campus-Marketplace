import { prisma } from "../config/db.js";
import { type AuthenticatedRequest } from "../middleware/auth.js";
import { type Response } from "express";

export const getItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { categorySlug, search, status } = req.query;

    const whereClause: any = {};

    if (categorySlug) {
      whereClause.category = { slug: String(categorySlug) };
    }
    if (status) {
      whereClause.status = String(status);
    } else {
      whereClause.status = "AVAILABLE";
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(items);
  } catch (error) {
    console.error("getItems Error:", error);
    return res.status(500).json({ error: "Failed to fetch items" });
  }
};

export const getItemById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const itemId = Array.isArray(id) ? id[0] : id;
    if (!itemId) {
      return res.status(400).json({ error: "Item ID is required" });
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        category: true,
        seller: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    console.log(item);
    return res.json(item);
  } catch (error) {
    console.error("getItemById Error:", error);
    return res.status(500).json({ error: "Failed to fetch item details" });
  }
};

export const createItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log("--> Received POST /api/items request");
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    const { title, description, price, categoryId } = req.body;

    if (!title || !price || !categoryId) {
      return res
        .status(400)
        .json({ error: "Title, price, and category are required" });
    }

    if (!req.user?.id) {
      return res
        .status(401)
        .json({ error: "User identity missing from request" });
    }

    const files = req.files as Express.Multer.File[] | undefined;
    const images =
      files && Array.isArray(files) ? files.map((file) => file.path) : [];

    const newItem = await prisma.item.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        images,
        categoryId,
        sellerId: req.user.id,
        status: "AVAILABLE",
      },
      include: {
        category: true,
        seller: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return res.status(201).json(newItem);
  } catch (error) {
    console.error("createItem Error:", error);
    return res.status(500).json({ error: "Failed to create item listing" });
  }
};
export const getCategories = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return res.json(categories);
  } catch (error) {
    console.error("getCategories Error:", error);
    return res.status(500).json({ error: "Failed to fetch categories" });
  }
};

export const getSellerItems = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user as any;

    const items = await prisma.item.findMany({
      where: {
        sellerId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json(items);
  } catch (error) {
    console.error("Error fetching seller items:", error);
    return res.status(500).json({ error: "Failed to fetch your listings" });
  }
};

export const updateItemStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const userId = (req.user as any).id;
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.sellerId !== userId)return res.status(403).json({ error: "Unauthorized" });

    const updatedItem = await prisma.item.update({
      where : {id},
      data:{
        status
      },
    });

    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("Error updating status:", error);
    return res.status(500).json({ error: "Failed to update status" });
  }
};

export const deleteItem = async(req : AuthenticatedRequest,res : Response) => {
  try {
    const id = req.params.id as string;
    const userId = (req.user as any).id;
    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.sellerId !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    await prisma.item.delete({ where: { id } });

    return res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({ error: "Failed to delete item" });
  }
}
