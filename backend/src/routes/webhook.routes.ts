import { Router } from "express";
import express from "express";
import { Webhook } from "svix";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();


router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error("Missing CLERK_WEBHOOK_SECRET in environment variables");
      return res.status(500).json({ error: "Webhook secret missing" });
    }

    const svix_id = req.headers["svix-id"] as string;
    const svix_timestamp = req.headers["svix-timestamp"] as string;
    const svix_signature = req.headers["svix-signature"] as string;

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({ error: "Missing svix headers" });
    }

    let evt: any;
    try {
      const payload = req.body.toString("utf8");
      const wh = new Webhook(WEBHOOK_SECRET);
      evt = wh.verify(payload, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const eventType = evt.type;
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    const primaryEmail = email_addresses?.[0]?.email_address;
    const fullName = `${first_name || ""} ${last_name || ""}`.trim();

    try {
      switch (eventType) {
        case "user.created":
        case "user.updated": {
          await prisma.user.upsert({
            where: { clerkId: id },
            update: {
              email: primaryEmail,
              name: fullName,
              avatarUrl: image_url,
            },
            create: {
              clerkId: id,
              email: primaryEmail,
              name: fullName,
              avatarUrl: image_url,
            },
          });
          console.log(`Synced user ${id} (${eventType}) to database.`);
          break;
        }

        case "user.deleted": {
          await prisma.user.delete({
            where: { clerkId: id },
          });
          console.log(`Deleted user ${id} from database.`);
          break;
        }

        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Database operation failed during webhook:", error);
      return res.status(500).json({ error: "Database error" });
    }
  },
);

export default router;
