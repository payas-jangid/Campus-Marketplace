import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "../config/redis.js";
import type { Request, Response, NextFunction } from "express";

export const generalLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_general",
    points: 100,
    duration: 60
});

export const createListingLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: "rl_create_item",
    points: 5,
    duration: 600,
    blockDuration: 600
});

export const rateLimitMiddleware = (limiter : RateLimiterRedis) => {
    return async (req : Request,res : Response,next : NextFunction) => {
        const key = (req as any).auth.userId || req.ip || "anonymous";

        try {
          await limiter.consume(key);
          next();
        } catch (rejRes: any) {
            const retrySecs = Math.round(rejRes?.msBeforeNext / 1000) || 60;
            res.set("Retry-After", String(retrySecs));
            return res.status(429).json({
              error: "Too Many Requests",
              message: `Rate limit exceeded. Please try again in ${retrySecs} seconds.`,
            });
        }
    }
}