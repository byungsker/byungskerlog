import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () => {
  const { mockPrisma } = await import("../mocks/prisma");
  return { prisma: mockPrisma };
});

import { GET } from "@/app/api/tags/route";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

describe("태그 목록 조회 GET /api/tags", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("중복 slug를 제외하고 indexable 글만 태그 개수에 반영한다", async () => {
    mockPrisma.tag.findMany.mockResolvedValue([
      {
        id: "tag-1",
        name: "frontend",
        slug: "frontend",
        posts: [
          { type: "LONG", content: "가".repeat(1_000) },
          { type: "SHORT", content: "가".repeat(299) },
        ],
      },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([{ tag: "frontend", count: 1, id: "tag-1", slug: "frontend" }]);
    expect(mockPrisma.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          posts: expect.objectContaining({
            where: { published: true, slug: { notIn: ["웹앱에서-스플래시-스크린-만들기"] } },
          }),
        }),
      })
    );
  });
});
