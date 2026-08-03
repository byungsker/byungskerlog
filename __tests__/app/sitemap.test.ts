import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

import sitemap from "@/app/sitemap";

describe("sitemap 공개 콘텐츠 정책", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("중복·thin 포스트와 내용이 부족한 모음 페이지를 제외한다", async () => {
    const updatedAt = new Date("2026-08-03T00:00:00.000Z");
    mockPrisma.post.findMany
      .mockResolvedValueOnce([
        { slug: "웹앱에서-스플래시-스크린-만들기", content: "가".repeat(2_000), updatedAt },
        { slug: "web-app-splash-screen", content: "가".repeat(2_000), updatedAt },
        { slug: "thin-long", content: "가".repeat(999), updatedAt },
      ])
      .mockResolvedValueOnce([
        { slug: "valuable-short", content: "가".repeat(300), updatedAt },
        { slug: "thin-short", content: "가".repeat(299), updatedAt },
      ]);
    mockPrisma.series.findMany.mockResolvedValue([
      {
        slug: "full-series",
        updatedAt,
        posts: [
          { type: "LONG", content: "가".repeat(1_000) },
          { type: "LONG", content: "가".repeat(1_000) },
        ],
      },
      {
        slug: "thin-series",
        updatedAt,
        posts: [
          { type: "LONG", content: "가".repeat(999) },
          { type: "LONG", content: "가".repeat(999) },
        ],
      },
    ]);
    mockPrisma.tag.findMany.mockResolvedValue([
      {
        name: "full-tag",
        updatedAt,
        posts: [
          { type: "SHORT", content: "가".repeat(300) },
          { type: "SHORT", content: "가".repeat(300) },
          { type: "SHORT", content: "가".repeat(300) },
        ],
      },
      {
        name: "thin-tag",
        updatedAt,
        posts: [
          { type: "SHORT", content: "가".repeat(299) },
          { type: "SHORT", content: "가".repeat(299) },
          { type: "SHORT", content: "가".repeat(299) },
        ],
      },
    ]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://byungskerlog.com/posts/web-app-splash-screen");
    expect(urls).toContain("https://byungskerlog.com/short/valuable-short");
    expect(urls).toContain("https://byungskerlog.com/series/full-series");
    expect(urls).toContain("https://byungskerlog.com/tags/full-tag");
    expect(urls).not.toContain("https://byungskerlog.com/posts/웹앱에서-스플래시-스크린-만들기");
    expect(urls).not.toContain("https://byungskerlog.com/posts/thin-long");
    expect(urls).not.toContain("https://byungskerlog.com/short/thin-short");
    expect(urls).not.toContain("https://byungskerlog.com/short-posts");
    expect(urls).not.toContain("https://byungskerlog.com/series/thin-series");
    expect(urls).not.toContain("https://byungskerlog.com/tags/thin-tag");

    expect(mockPrisma.post.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ slug: { notIn: ["웹앱에서-스플래시-스크린-만들기"] } }),
      })
    );
  });
});
