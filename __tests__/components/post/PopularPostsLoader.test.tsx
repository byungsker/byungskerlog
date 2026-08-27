import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { format } from "date-fns";
import { createCalendarDate } from "@/lib/home-popular-posts";
import { PopularPostsLoader } from "@/components/post/PopularPostsLoader";

const mockPrisma = vi.hoisted(() => ({
  post: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
}));

interface RenderedPopularPost {
  title: string;
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

describe("PopularPostsLoader", () => {
  beforeEach(() => {
    mockPrisma.post.findMany.mockReset();
    mockPrisma.$queryRaw.mockReset();
    popularPostsMock.mockClear();
  });

  it("비 UTC 환경에서도 기준선의 편집 날짜를 유지한다", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");

    expect(format(createCalendarDate("2024-11-10"), "yyyy.MM.dd")).toBe("2024.11.10");

    vi.unstubAllEnvs();
  });

  it("잘못된 편집 날짜를 거부한다", () => {
    expect(() => createCalendarDate("2024-02-30")).toThrow("Invalid calendar date");
    expect(() => createCalendarDate("2024-2-3")).toThrow("Expected date in YYYY-MM-DD format");
  });

  it("고정한 네 글을 실제 조회수 내림차순으로 정렬하고 동률은 기존 순서를 유지한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([
      {
        slug: "teoconf2024-스피커-후기-bloj8ivk",
        id: "post-42",
      },
      {
        slug: "내-프로젝트에-짧고-빠르게-storybook-도입하기",
        id: "post-42b",
      },
      {
        slug: "figmable-cli-배포무료플랜에서-피그마-rest-api로-토큰-가져오기",
        id: "post-100",
      },
    ]);
    mockPrisma.$queryRaw.mockResolvedValue([
      { postId: "post-42", count: BigInt(42) },
      { postId: "post-42b", count: BigInt(42) },
      { postId: "post-100", count: BigInt(100) },
    ]);

    render(await PopularPostsLoader());

    expect(popularPostsMock).toHaveBeenCalledTimes(1);
    const [props] = popularPostsMock.mock.calls[0]!;
    const posts = props.posts;
    expect(posts).toHaveLength(4);
    expect(posts.map((post) => post.title)).toEqual([
      "피그마 무료 플랜에서 컬러 코드 추출 자동화하기! (feat. Figmable CLI 배포)",
      "TeoConf2024 스피커 후기",
      "짧고 빠르게 Storybook 도입하기!",
      "Fluttrer Web에서 Javascript 유연하게 사용하기 (feat. JS interop의 A to Z)",
    ]);
    expect(posts[0]).not.toHaveProperty("viewCount");
    expect(posts[0]).not.toHaveProperty("isBaseline");
    expect(posts[1].href).toBe("/posts/teoconf2024-스피커-후기-bloj8ivk");
    expect(posts[2].href).toBe("/posts/내-프로젝트에-짧고-빠르게-storybook-도입하기");
    expect(posts.map((post) => format(post.createdAt, "yyyy-MM-dd"))).toEqual([
      "2025-03-16",
      "2025-02-10",
      "2025-01-19",
      "2024-11-10",
    ]);
    expect(posts[3].href).toBe("https://byungskerlog.com/posts/fluttrer-web에서-javascript-유연하게-사용하기");
    expect(posts[3]).not.toHaveProperty("viewCount");
    expect(posts[3]).not.toHaveProperty("isBaseline");
  });
});
