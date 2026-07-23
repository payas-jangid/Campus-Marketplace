import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import authRoutes from "./routes/auth.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import itemRoutes from "./routes/item.routes.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer,{
    cors : {origin : '*'}
});

app.use(cors());

app.use("/api/webhooks", webhookRoutes);
app.use(express.json());

app.use("/api/items",itemRoutes);
app.use(clerkMiddleware);
app.use("/api/auth",authRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT,() => {
    console.log(`Server running on http://localhost:${PORT}`)
});