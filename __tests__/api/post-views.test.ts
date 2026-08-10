import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  post: { findUnique: vi.fn() },
  postView: { create: vi.fn() },
}));

const { mockRevalidatePostListCaches } = vi.hoisted(() => ({
  mockRevalidatePostListCaches: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/post-cache", () => ({ revalidatePostListCaches: mockRevalidatePostListCaches }));

import { POST } from "@/app/api/posts-by-slug/[slug]/views/route";

const params = { params: Promise.resolve({ slug: "popular-post" }) };

describe("POST /api/posts-by-slug/[slug]/views", () => {
  beforeEach(() => {
    mockPrisma.post.findUnique.mockReset();
    mockPrisma.postView.create.mockReset();
    mockRevalidatePostListCaches.mockReset();
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
        ipAddress: "unknown",
        userAgent: "unknown",
      },
    });
    expect(mockRevalidatePostListCaches).toHaveBeenCalledTimes(1);
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
});
