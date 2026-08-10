import { Router, type Response } from "express";
import {
  requireAuthUser,
  type AuthenticatedRequest,
} from "../middleware/auth.js";
import { prisma } from "../config/db.js";

const router = Router();

// 1. UPDATE OFFER STATUS
router.patch(
  "/messages/:messageId/offer-status",
  requireAuthUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const messageId = req.params.messageId as string;
      const { status } = req.body;

      if (!["ACCEPTED", "REJECTED"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { offerStatus: status },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return res.status(200).json(updatedMessage);
    } catch (error) {
      console.error("Error updating offer status:", error);
      return res.status(500).json({ error: "Failed to update offer status" });
    }
  },
);

// 2. CREATE OR FETCH A CHAT THREAD (Changed from GET to POST)
router.post(
  "/",
  requireAuthUser,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("trying");
    try {
      const { itemId, sellerId } = req.body;

      const user = req.user as any;
      const buyerId = user.id; 

      if (!itemId || !sellerId) {
        return res
          .status(400)
          .json({ error: "Missing required fields: itemId and sellerId" });
      }

      // if (buyerId === sellerId) {
      //   return res.status(400).json({ error: "You cannot start a chat thread with yourself." });
      // }

      let chat = await prisma.chat.findUnique({
        where: {
          itemId_buyerId: { itemId, buyerId },
        },
        include: {
          item: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
              status: true,
            },
          },
          seller: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          buyer: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      if (!chat) {
        chat = await prisma.chat.create({
          data: {
            itemId,
            buyerId,
            sellerId,
          },
          include: {
            item: {
              select: {
                id: true,
                title: true,
                price: true,
                images: true,
                status: true,
              },
            },
            seller: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            buyer: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        });
      }

      return res.status(200).json(chat);
    } catch (error) {
      console.error("Error creating/fetching chat thread:", error);
      return res
        .status(500)
        .json({ error: "Internal server error starting chat." });
    }
  },
);

// 3. GET ALL CHATS FOR INBOX (This stays GET)
router.get(
  "/",
  requireAuthUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Fetch DB user UUID
      const user = req.user as any;
      const userId = user.id;

      const chats = await prisma.chat.findMany({
        where: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          item: {
            select: {
              id: true,
              title: true,
              price: true,
              images: true,
              status: true,
            },
          },
          seller: {
            select: { id: true, name: true, avatarUrl: true },
          },
          buyer: {
            select: { id: true, name: true, avatarUrl: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { content: true, type: true, createdAt: true },
          },
        },
      });

      return res.status(200).json(chats);
    } catch (error) {
      console.error("Error fetching user chats:", error);
      return res.status(500).json({ error: "Failed to fetch inbox." });
    }
  },
);

// 4. GET MESSAGES FOR A CHAT
router.get(
  "/:chatId/messages",
  requireAuthUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chatId } = req.params;

      if (typeof chatId !== "string") {
        return res.status(400).json({ error: "Invalid chatId parameter." });
      }

      const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: "desc" },
        include: {
          sender: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      return res.status(200).json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: "Failed to fetch chat messages." });
    }
  },
);

export default router;
