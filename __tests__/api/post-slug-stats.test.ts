import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  post: { findFirst: vi.fn() },
}));
const mockGetDistinctPostViewWindowStats = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/analytics/post-view-stats", () => ({
  getDistinctPostViewWindowStats: mockGetDistinctPostViewWindowStats,
}));

import { GET } from "@/app/api/posts-by-slug/[slug]/stats/route";

describe("GET /api/posts-by-slug/[slug]/stats", () => {
  beforeEach(() => {
    mockPrisma.post.findFirst.mockReset();
    mockGetDistinctPostViewWindowStats.mockReset();
  });

  it("공개되지 않은 글의 통계 조회를 차단한다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    const response = await GET(new NextRequest("http://localhost/api/posts-by-slug/draft-post/stats"), {
      params: Promise.resolve({ slug: "draft-post" }),
    });

    expect(response.status).toBe(404);
    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
      where: { slug: "draft-post", published: true },
      select: { id: true },
    });
    expect(mockGetDistinctPostViewWindowStats).not.toHaveBeenCalled();
  });
});
