import { NextResponse } from "next/server";

import {
  connectToDatabase,
  RateLimitBucket,
} from "@/lib/db";
import { NO_STORE_HEADERS } from "@/lib/api-config";

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec?: number;
};

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export async function checkRateLimit(
  req: Request,
  routeKey: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  await connectToDatabase();

  const ip = getClientIp(req);
  const key = `${routeKey}:${ip}`;
  const now = new Date();
  const windowStart = new Date(
    now.getTime() - windowMs
  );

  const bucket = await RateLimitBucket.findOne({ key });

  if (!bucket || bucket.windowStart < windowStart) {
    await RateLimitBucket.findOneAndUpdate(
      { key },
      {
        $set: {
          key,
          count: 1,
          windowStart: now,
        },
      },
      { upsert: true, new: true }
    );
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    const retryAfterSec = Math.ceil(
      (bucket.windowStart.getTime() +
        windowMs -
        now.getTime()) /
        1000
    );
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, retryAfterSec),
    };
  }

  await RateLimitBucket.updateOne(
    { key },
    { $inc: { count: 1 } }
  );

  return {
    ok: true,
    remaining: limit - bucket.count - 1,
  };
}

export function rateLimitResponse(
  retryAfterSec?: number
): NextResponse {
  return NextResponse.json(
    {
      error:
        "Muitas tentativas. Aguarde um momento e tente novamente.",
    },
    {
      status: 429,
      headers: {
        ...NO_STORE_HEADERS,
        ...(retryAfterSec
          ? { "Retry-After": String(retryAfterSec) }
          : {}),
      },
    }
  );
}
