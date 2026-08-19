import dotenv from "dotenv";
dotenv.config();
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { clerkClient,clerkMiddleware } from "@clerk/express";
import { verifyToken } from "@clerk/backend";
import "./config/redis.js"

import authRoutes from "./routes/auth.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import itemRoutes from "./routes/item.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { prisma } from "./config/db.js";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());

app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(clerkMiddleware());
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error: Token missing"));

    // Verify the Clerk token
    const decoded = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Find the real Database UUID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: decoded.sub },
      select: { id: true },
    });

    if (!dbUser) return next(new Error("User not found in database"));

    // Attach the verified ID to the socket
    socket.data.userId = dbUser.id;
    next();
  } catch (error) {
    console.error("Socket Auth Error:", error);
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(
    "User connected:",
    socket.id,
    "Verified DB User:",
    socket.data.userId,
  );

  socket.on("join_room", (chatId) => {
    socket.join(chatId);
  });

  socket.on("send_message", async (data) => {
    const { chatId, content, type, offerAmount } = data;
    const verifiedSenderId = socket.data.userId;
    try {

      const savedMessage = await prisma.message.create({
        data: {
          chatId,
          senderId : verifiedSenderId,
          content,
          type: type || "TEXT",
          offerAmount: offerAmount ? parseFloat(offerAmount) : null,
          offerStatus: type === "OFFER" ? "PENDING" : null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
      io.to(chatId).emit("receive_message", savedMessage);
    } catch (err) {
      console.error("Failed to save message via socket:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔥 User disconnected:", socket.id);
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
