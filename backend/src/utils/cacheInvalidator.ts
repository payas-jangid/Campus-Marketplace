import { redis } from "../config/redis.js";

/**
 * Purges all Redis keys matching a specific pattern.
 */
export const invalidateCachePattern = async (pattern: string) => {
  try {
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on("data", async (keys: string[]) => {
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach((key) => pipeline.del(key));
        await pipeline.exec();
      }
    });

    stream.on("error", (err) => {
      console.error("Redis cache scan error:", err);
    });
  } catch (error) {
    console.error("Failed to invalidate cache pattern:", error);
  }
};
