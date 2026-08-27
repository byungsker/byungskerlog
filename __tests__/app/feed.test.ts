import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import { GET } from "@/app/feed.xml/route";

describe("공개 RSS URL 정책", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("LONG과 SHORT를 각 대표 경로로 내보내고 중복 slug를 조회에서 제외한다", async () => {
    const createdAt = new Date("2026-08-03T00:00:00.000Z");
    mockPrisma.post.findMany.mockResolvedValue([
      { slug: "long-post", title: "Long", excerpt: null, createdAt, type: "LONG", tags: [] },
      { slug: "short-post", title: "Short", excerpt: null, createdAt, type: "SHORT", tags: [] },
    ]);

    const response = await GET();
    const xml = await response.text();

    expect(xml).toContain("https://byungskerlog.com/posts/long-post");
    expect(xml).toContain("https://byungskerlog.com/short/short-post");
    expect(xml).not.toContain("byungskerlog.vercel.app");
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: { notIn: ["웹앱에서-스플래시-스크린-만들기"] } }),
      })
    );
  });
});
