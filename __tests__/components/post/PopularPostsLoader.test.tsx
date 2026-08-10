import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { mockPrisma, resetPrismaMocks } from "../../mocks/prisma";

interface RenderedPopularPost {
  title: string;
  viewCount: number;
  isBaseline: boolean;
  href: string;
  createdAt: Date;
}

const popularPostsMock = vi.hoisted(() =>
  vi.fn((props: { posts: RenderedPopularPost[] }) => {
    void props;
    return null;
  })
);

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/cache", () => ({ unstable_cache: (callback: () => unknown) => callback }));
vi.mock("@/components/post/PopularPosts", () => ({ PopularPosts: popularPostsMock }));

import { PopularPostsLoader } from "@/components/post/PopularPostsLoader";

describe("PopularPostsLoader", () => {
  beforeEach(() => {
    resetPrismaMocks();
    popularPostsMock.mockClear();
  });

  it("고정한 네 글의 순서를 유지하고 일치하는 DB 행의 조회수만 보강한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([
      {
        slug: "teoconf2024-스피커-후기-bloj8ivk",
        _count: { views: 42 },
      },
    ]);

    render(await PopularPostsLoader());

    expect(popularPostsMock).toHaveBeenCalledTimes(1);
    const [props] = popularPostsMock.mock.calls[0]!;
    const posts = props.posts;
    expect(posts).toHaveLength(4);
    expect(posts.map((post) => post.title)).toEqual([
      "Fluttrer Web에서 Javascript 유연하게 사용하기 (feat. JS interop의 A to Z)",
      "TeoConf2024 스피커 후기",
      "피그마 무료 플랜에서 컬러 코드 추출 자동화하기! (feat. Figmable CLI 배포)",
      "짧고 빠르게 Storybook 도입하기!",
    ]);
    expect(posts[1]).toMatchObject({ viewCount: 42, isBaseline: false });
    expect(posts[1].href).toBe("/posts/teoconf2024-스피커-후기-bloj8ivk");
    expect(posts[0]).toMatchObject({ viewCount: 0, isBaseline: true });
    expect(posts.map((post) => post.createdAt.toISOString().slice(0, 10))).toEqual([
      "2024-11-10",
      "2025-02-10",
      "2025-03-16",
      "2025-01-19",
    ]);
    expect(posts[0].href).toBe("https://byungskerlog.com/posts/fluttrer-web에서-javascript-유연하게-사용하기");
  });
});
