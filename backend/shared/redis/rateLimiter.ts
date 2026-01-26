import { redis } from './redisClient';

export async function isRateLimited(
  userId: string,
  endpoint: string,
  limit: number,
  windowSeconds: number
) {
  const key = `ratelimit:${userId}:${endpoint}`;

  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return count > limit;
}
