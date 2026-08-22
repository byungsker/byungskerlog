import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  post: { findUnique: vi.fn() },
  postView: { create: vi.fn() },
}));

const { mockRevalidatePostListCaches } = vi.hoisted(() => ({
  mockRevalidatePostListCaches: vi.fn(),
}));

const { mockCheckRequestRateLimit } = vi.hoisted(() => ({
  mockCheckRequestRateLimit: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/post-cache", () => ({ revalidatePostListCaches: mockRevalidatePostListCaches }));
vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  return { ...actual, checkRequestRateLimit: mockCheckRequestRateLimit };
});

import { POST } from "@/app/api/posts-by-slug/[slug]/views/route";
import { VISITOR_ID_COOKIE } from "@/lib/analytics/visitor-identity";

const params = { params: Promise.resolve({ slug: "popular-post" }) };

describe("POST /api/posts-by-slug/[slug]/views", () => {
  beforeEach(() => {
    mockPrisma.post.findUnique.mockReset();
    mockPrisma.postView.create.mockReset();
    mockRevalidatePostListCaches.mockReset();
    mockCheckRequestRateLimit.mockReset();
    mockCheckRequestRateLimit.mockReturnValue({
      allowed: true,
      count: 1,
      remaining: 59,
      resetTime: Date.now() + 60000,
    });
  });

  it("조회 기록에 성공하면 인기 글 캐시를 무효화한다", async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    mockPrisma.postView.create.mockResolvedValue({ id: "view-1" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts-by-slug/popular-post/views", { method: "POST" }),
      params
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.postView.create).toHaveBeenCalledWith({
      data: {
        postId: "post-1",
        visitorId: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
        ipAddress: "unknown",
        userAgent: "unknown",
      },
    });
    expect(mockRevalidatePostListCaches).toHaveBeenCalledTimes(1);
    const storedVisitorId = mockPrisma.postView.create.mock.calls[0][0].data.visitorId;
    expect(response.headers.get("set-cookie")).toContain(`${VISITOR_ID_COOKIE}=${storedVisitorId}`);
  });

  it("기존 visitorId 쿠키를 조회 기록에 저장해 반복 사용자를 dedupe할 수 있게 한다", async () => {
    const visitorId = "11111111-1111-4111-8111-111111111111";
    mockPrisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    mockPrisma.postView.create.mockResolvedValue({ id: "view-1" });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts-by-slug/popular-post/views", {
        method: "POST",
        headers: { Cookie: `${VISITOR_ID_COOKIE}=${visitorId}` },
      }),
      params
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.postView.create).toHaveBeenCalledWith({
      data: {
        postId: "post-1",
        visitorId,
        ipAddress: "unknown",
        userAgent: "unknown",
      },
    });
  });

  it("조회 기록 저장에 실패하면 인기 글 캐시를 무효화하지 않는다", async () => {
    mockPrisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    mockPrisma.postView.create.mockRejectedValue(new Error("Database unavailable"));

    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts-by-slug/popular-post/views", { method: "POST" }),
      params
    );

    expect(response.status).toBe(500);
    expect(mockRevalidatePostListCaches).not.toHaveBeenCalled();
  });

  it("캐시 무효화에 실패해도 저장된 조회 기록은 201으로 응답하고 다시 저장하지 않는다", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockPrisma.post.findUnique.mockResolvedValue({ id: "post-1" });
    mockPrisma.postView.create.mockResolvedValue({ id: "view-1" });
    mockRevalidatePostListCaches.mockImplementation(() => {
      throw new Error("Cache unavailable");
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts-by-slug/popular-post/views", { method: "POST" }),
      params
    );

    expect(response.status).toBe(201);
    expect(mockPrisma.postView.create).toHaveBeenCalledTimes(1);
    expect(mockRevalidatePostListCaches).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      "Failed to invalidate post list caches after recording view:",
      expect.any(Error)
    );

    consoleError.mockRestore();
  });

  it("조회 rate limit을 초과하면 DB 조회 전에 429를 반환한다", async () => {
    mockCheckRequestRateLimit.mockReturnValue({
      allowed: false,
      count: 60,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const response = await POST(
      new NextRequest("http://localhost:3000/api/posts-by-slug/popular-post/views", {
        method: "POST",
        headers: { "x-forwarded-for": "203.0.113.10" },
      }),
      params
    );
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(response.headers.get("Retry-After")).toBeTruthy();
    expect(mockPrisma.post.findUnique).not.toHaveBeenCalled();
  });
});
