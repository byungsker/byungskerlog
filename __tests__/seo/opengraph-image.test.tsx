import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  post: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/og", () => ({
  ImageResponse: vi.fn((element, options) => ({ element, options })),
}));

import LongOpenGraphImage from "@/app/posts/[slug]/opengraph-image";
import ShortOpenGraphImage from "@/app/short/[slug]/opengraph-image";

describe("공개 게시글 Open Graph 이미지 조회", () => {
  beforeEach(() => {
    mockPrisma.post.findFirst.mockReset();
  });

  it("LONG 이미지가 공개된 LONG 글만 조회한다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await LongOpenGraphImage({ params: Promise.resolve({ slug: "draft-long" }) });

    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        published: true,
        type: "LONG",
        OR: [{ slug: "draft-long" }, { subSlug: "draft-long" }],
      },
      select: { title: true, thumbnail: true },
    });
  });

  it("SHORT 이미지가 공개된 SHORT 글만 조회한다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);

    await ShortOpenGraphImage({ params: Promise.resolve({ slug: "draft-short" }) });

    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        published: true,
        OR: [{ slug: "draft-short" }, { subSlug: "draft-short" }],
        type: "SHORT",
      },
      select: { title: true, thumbnail: true },
    });
  });
});
