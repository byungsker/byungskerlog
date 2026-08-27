import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/feed.xml/route";

describe("RSS feed 공개 URL", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("LONG와 SHORT 글을 각각의 canonical route로 발행한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([
      {
        slug: "long-post",
        title: "Long 글",
        excerpt: "Long 설명",
        createdAt: new Date("2026-08-28T00:00:00.000Z"),
        type: "LONG",
        tags: [],
      },
      {
        slug: "short-post",
        title: "Short 글",
        excerpt: "Short 설명",
        createdAt: new Date("2026-08-27T00:00:00.000Z"),
        type: "SHORT",
        tags: [],
      },
    ]);

    const response = await GET();
    const feed = await response.text();

    expect(feed).toContain("https://byungskerlog.com/posts/long-post");
    expect(feed).toContain("https://byungskerlog.com/short/short-post");
    expect(feed).not.toContain("https://byungskerlog.com/posts/short-post");
  });
});
