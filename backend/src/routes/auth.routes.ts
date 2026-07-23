import { Router} from "express";
import {type Response } from "express"
import { requireAuthUser } from "../middleware/auth.js";
import { type AuthenticatedRequest } from "../middleware/auth.js";
const router = Router();

/**
 * GET /api/auth/me
 * Returns the logged-in user's PostgreSQL record
 */
router.get(
  "/me",
  requireAuthUser,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      message: "Authenticated successfully",
      user: req.user,
    });
  },
);

export default router;
