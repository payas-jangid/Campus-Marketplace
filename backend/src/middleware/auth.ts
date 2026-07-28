import type { Request, Response, NextFunction } from "express";
import { getAuth,clerkClient } from "@clerk/express";
import { prisma } from "../config/db.js";
export interface AuthenticatedRequest extends Request {
  user?: any;
}

//  org.gradle.java.home=C:\\Program Files\\Java\\jdk-23

export const requireAuthUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No active session found" });
    }

    let dbUser = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    if (!dbUser) {
      const clerkUser = await clerkClient.users.getUser(auth.userId);
      const primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        "";

      const fullName =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
        "Market User";

      dbUser = await prisma.user.upsert({
        where: { clerkId: auth.userId },
        update: {
          name: fullName,
          email: primaryEmail,
          avatarUrl: clerkUser.imageUrl,
        },
        create: {
          clerkId: auth.userId,
          name: fullName,
          email: primaryEmail,
          avatarUrl: clerkUser.imageUrl,
        },
      });
    }

    // Attach local DB user object to the request
    req.user = dbUser;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ error: "Authentication processing failed" });
  }
};
