import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";

const adSenseMock = vi.hoisted(() => vi.fn(() => null));

vi.mock("@/components/post/PostListLoader", () => ({
  PostListLoader: () => null,
}));
vi.mock("@/components/post/PopularPostsLoader", () => ({
  PopularPostsLoader: () => createElement("div", { "data-testid": "popular-posts-loader-sentinel" }),
}));
vi.mock("@/components/skeleton/PostListSkeleton", () => ({
  PostListSkeleton: () => null,
}));
vi.mock("@/components/seo/Adsense", () => ({
  AdSense: adSenseMock,
}));
vi.mock("@/components/products/HomeProducts", () => ({
  HomeProducts: () => null,
}));

import Home, { dynamic } from "@/app/page";

describe("홈 페이지 렌더링 모드", () => {
  it("빌드 시 데이터베이스를 요구하지 않도록 요청 시점에 렌더링한다", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("콘텐츠 목록인 홈에서는 광고 슬롯을 렌더링하지 않는다", () => {
    render(Home());

    expect(adSenseMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("popular-posts-loader-sentinel")).toBeInTheDocument();
  });
});
