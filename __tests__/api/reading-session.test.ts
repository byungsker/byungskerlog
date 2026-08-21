import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  post: { findFirst: vi.fn() },
  readingSession: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

const { mockCheckRequestRateLimit } = vi.hoisted(() => ({
  mockCheckRequestRateLimit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  return { ...actual, checkRequestRateLimit: mockCheckRequestRateLimit };
});

import { POST } from "@/app/api/posts-by-slug/[slug]/reading-session/route";

const params = { params: Promise.resolve({ slug: "long-post" }) };

function createRequest() {
  return new NextRequest("http://localhost:3000/api/posts-by-slug/long-post/reading-session", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.11" },
    body: JSON.stringify({
      sessionId: "session-1",
      maxScrollDepth: 80,
      readingTime: 30,
      completed: false,
    }),
  });
}

describe("POST /api/posts-by-slug/[slug]/reading-session", () => {
  beforeEach(() => {
    mockPrisma.post.findFirst.mockReset();
    mockPrisma.readingSession.findUnique.mockReset();
    mockPrisma.readingSession.create.mockReset();
    mockPrisma.readingSession.update.mockReset();
    mockCheckRequestRateLimit.mockReset();
    mockCheckRequestRateLimit.mockReturnValue({
      allowed: true,
      count: 1,
      remaining: 119,
      resetTime: Date.now() + 60000,
    });
  });

  it("정상 reading session 저장에 rate limit 헤더를 붙인다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue({ id: "post-1" });
    mockPrisma.readingSession.findUnique.mockResolvedValue(null);
    mockPrisma.readingSession.create.mockResolvedValue({ id: "session-row-1" });

    const response = await POST(createRequest(), params);

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("119");
    expect(mockPrisma.readingSession.create).toHaveBeenCalledWith({
      data: {
        postId: "post-1",
        sessionId: "session-1",
        maxScrollDepth: 80,
        readingTime: 30,
        completed: false,
      },
    });
  });

  it("rate limit 초과 시 post/session DB를 조회하지 않는다", async () => {
    mockCheckRequestRateLimit.mockReturnValue({
      allowed: false,
      count: 120,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const response = await POST(createRequest(), params);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(mockPrisma.post.findFirst).not.toHaveBeenCalled();
    expect(mockPrisma.readingSession.create).not.toHaveBeenCalled();
  });
});
