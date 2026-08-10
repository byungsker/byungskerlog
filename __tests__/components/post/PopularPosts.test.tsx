import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PopularPosts } from "@/components/post/PopularPosts";

describe("PopularPosts", () => {
  it("조회수 순서로 전달된 네 개의 인기 글을 카드 목록과 구분된 링크로 렌더링한다", () => {
    render(
      <PopularPosts
        posts={Array.from({ length: 4 }, (_, index) => ({
          id: `post-${index}`,
          href: `/posts/post-${index}`,
          title: `인기 글 ${index + 1}`,
          createdAt: new Date("2026-08-10T00:00:00.000Z"),
          viewCount: 100 - index,
          isBaseline: false,
        }))}
      />
    );

    expect(screen.getByRole("heading", { name: "많이 읽힌 글" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("list")).toHaveClass("grid-cols-1", "sm:grid-cols-2", "lg:grid-cols-4");
    expect(screen.getByRole("link", { name: /인기 글 1/ })).toHaveAttribute("href", "/posts/post-0");
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("DB에 없는 고정 글도 기준선과 0 조회수로 표시한다", () => {
    render(
      <PopularPosts
        posts={[
          {
            id: "baseline",
            href: "https://byungskerlog.com/posts/baseline",
            title: "기준선 글",
            createdAt: new Date("2026-08-10T00:00:00.000Z"),
            viewCount: 0,
            isBaseline: true,
          },
        ]}
      />
    );

    expect(screen.getByText("기준선")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
