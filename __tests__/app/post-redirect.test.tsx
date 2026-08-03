import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

const navigationMocks = vi.hoisted(() => ({
  permanentRedirect: vi.fn((destination: string) => {
    throw new Error(`redirect:${destination}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/navigation", () => navigationMocks);
vi.mock("@/components/post/PostDetailLoader", () => ({ PostDetailLoader: () => null }));
vi.mock("@/components/skeleton/PostDetailSkeleton", () => ({ PostDetailSkeleton: () => null }));

import PostPage, { generateMetadata } from "@/app/posts/[slug]/page";

describe("중복 LONG 포스트 URL 통합", () => {
  beforeEach(() => {
    resetPrismaMocks();
    navigationMocks.permanentRedirect.mockClear();
    navigationMocks.notFound.mockClear();
  });

  it("중복 slug를 DB 조회 전에 대표 URL로 영구 리다이렉트한다", async () => {
    await expect(
      PostPage({ params: Promise.resolve({ slug: encodeURIComponent("웹앱에서-스플래시-스크린-만들기") }) })
    ).rejects.toThrow("redirect:/posts/web-app-splash-screen");

    expect(navigationMocks.permanentRedirect).toHaveBeenCalledWith("/posts/web-app-splash-screen");
    expect(mockPrisma.post.findFirst).not.toHaveBeenCalled();
  });

  it("중복 slug 메타데이터를 noindex와 대표 canonical로 고정한다", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: encodeURIComponent("웹앱에서-스플래시-스크린-만들기") }),
    });

    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toEqual({ canonical: "https://byungskerlog.com/posts/web-app-splash-screen" });
    expect(mockPrisma.post.findFirst).not.toHaveBeenCalled();
  });
});
