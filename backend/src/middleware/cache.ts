import type { NextFunction, Request, Response } from "express";
import { redis } from "../config/redis.js";

export const checkCache = (ttlSeconds = 300) => {
    return async (req : Request,res : Response,next : NextFunction) => {
        const cacheKey = `cache:${req.baseUrl || ""}${req.path}:${JSON.stringify(req.query)}`;

        try {
            const cachedData = await redis.get(cacheKey);

            if(cachedData){
                res.setHeader("X-Cache","HIT");
                return res.status(200).json(JSON.parse(cachedData));
            }

            res.setHeader("X-Cache","MISS");
            const originalJson = res.json.bind(res);

            res.json = (body : any) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  redis
                    .set(cacheKey, JSON.stringify(body), "EX", ttlSeconds)
                    .catch((err) => {
                      console.error("Redis set error:", err);
                    });
                }
                return originalJson(body);
            }
            next();
        } catch (error) {
          console.error("Redis cache error, skipping to DB:", error);
          next(); // Degrade gracefully: proceed to database on cache failure
        }
    }
}