import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import sitemap from "@/app/sitemap";

describe("공개 sitemap", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("발행된 글을 canonical 도메인 URL로 포함한다", async () => {
    const updatedAt = new Date("2026-08-28T00:00:00.000Z");
    mockPrisma.post.findMany
      .mockResolvedValueOnce([{ slug: "새-게시글", updatedAt }])
      .mockResolvedValueOnce([]);
    mockPrisma.series.findMany.mockResolvedValue([]);
    mockPrisma.tag.findMany.mockResolvedValue([]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://byungskerlog.com/posts/새-게시글");
    expect(urls).not.toContain("https://byungskerlog.vercel.app/posts/새-게시글");
  });
});
