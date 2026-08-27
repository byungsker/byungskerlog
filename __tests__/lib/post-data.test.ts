import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", async () => {
  const { mockPrisma } = await import("../mocks/prisma");
  return { prisma: mockPrisma };
});

import { getPost } from "@/lib/post-data";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

describe("공개 게시글 조회", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("비공개 게시글을 공개 route 조회 대상에서 제외한다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await expect(getPost("draft-post")).resolves.toBeNull();

    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          published: true,
          OR: [{ slug: "draft-post" }, { subSlug: "draft-post" }],
        }),
      })
    );
  });
});
