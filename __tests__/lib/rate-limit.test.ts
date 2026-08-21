import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp, rateLimitExceededResponse } from "@/lib/rate-limit";

describe("rate limit helpers", () => {
  it("limit까지 허용한 뒤 같은 식별자를 차단한다", () => {
    const identifier = `rate-limit-test-${Date.now()}-${Math.random()}`;

    expect(checkRateLimit(identifier, 2)).toMatchObject({ allowed: true, count: 1, remaining: 1 });
    expect(checkRateLimit(identifier, 2)).toMatchObject({ allowed: true, count: 2, remaining: 0 });
    expect(checkRateLimit(identifier, 2)).toMatchObject({ allowed: false, count: 2, remaining: 0 });
  });

  it("x-forwarded-for의 첫 IP를 rate-limit 식별자로 사용하고 real-ip로 fallback한다", () => {
    const forwardedRequest = new NextRequest("http://localhost:3000", {
      headers: { "x-forwarded-for": "203.0.113.20, 10.0.0.1", "x-real-ip": "198.51.100.20" },
    });
    const realIpRequest = new NextRequest("http://localhost:3000", {
      headers: { "x-real-ip": "198.51.100.21" },
    });

    expect(getClientIp(forwardedRequest)).toBe("203.0.113.20");
    expect(getClientIp(realIpRequest)).toBe("198.51.100.21");
  });

  it("429 응답에 retry와 표준 rate-limit 헤더를 포함한다", async () => {
    const response = rateLimitExceededResponse(
      { allowed: false, count: 60, remaining: 0, resetTime: Date.now() + 60000 },
      60
    );
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("60");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
