import { LRUCache } from "lru-cache";
import { NextResponse } from "next/server";
import { ErrorCode } from "@/lib/api/errors";

export const RATE_LIMIT_WINDOW_MS = 60_000;

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  remaining: number;
  resetTime: number;
}

const rateLimitCache = new LRUCache<string, Omit<RateLimitResult, "allowed" | "remaining">>({
  max: 500,
  ttl: RATE_LIMIT_WINDOW_MS,
});

/**
 * Check if a request is within a fixed one-minute window.
 * The cache is process-local; edge or provider-level throttling remains a
 * separate production control for multi-instance deployments.
 */
export function checkRateLimit(identifier: string, limit: number = 20): RateLimitResult {
  const now = Date.now();
  const record = rateLimitCache.get(identifier);

  if (!record || now >= record.resetTime) {
    const nextRecord = { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
    rateLimitCache.set(identifier, nextRecord);
    return {
      allowed: true,
      count: nextRecord.count,
      remaining: Math.max(0, limit - nextRecord.count),
      resetTime: nextRecord.resetTime,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      count: record.count,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  rateLimitCache.set(identifier, record);
  return {
    allowed: true,
    count: record.count,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime,
  };
}

export function getClientIp(request: Request): string {
  // Vercel overwrites x-real-ip with the original client address. Prefer it
  // so a caller cannot rotate the public rate-limit bucket by supplying a
  // forged x-forwarded-for chain. The forwarded header remains a local/test
  // fallback; production without the trusted provider header fails closed to
  // one bucket instead of trusting an attacker-controlled value.
  const trustedClientIp = request.headers.get("x-real-ip")?.trim();
  if (trustedClientIp) {
    return trustedClientIp;
  }

  if (process.env.NODE_ENV === "production") {
    return "unknown";
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean);

  return firstForwardedIp || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkRequestRateLimit(request: Request, scope: string, limit: number): RateLimitResult {
  return checkRateLimit(`${scope}:ip:${getClientIp(request)}`, limit);
}

export function checkUserRateLimit(userId: string, scope: string, limit: number): RateLimitResult {
  return checkRateLimit(`${scope}:user:${userId}`, limit);
}

export function getRateLimitHeaders(result: RateLimitResult, limit: number) {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetTime / 1000).toString(),
  };
}

export function setRateLimitHeaders<T extends NextResponse>(response: T, result: RateLimitResult, limit: number): T {
  Object.entries(getRateLimitHeaders(result, limit)).forEach(([name, value]) => {
    response.headers.set(name, value);
  });
  return response;
}

export function rateLimitExceededResponse(result: RateLimitResult, limit: number): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      retryAfter,
    },
    {
      status: 429,
      headers: {
        ...getRateLimitHeaders(result, limit),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}
