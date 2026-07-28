import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/post/PostListLoader", () => ({
  PostListLoader: () => null,
}));
vi.mock("@/components/skeleton/PostListSkeleton", () => ({
  PostListSkeleton: () => null,
}));
vi.mock("@/components/seo/Adsense", () => ({
  AdSense: () => null,
}));
vi.mock("@/components/products/HomeProducts", () => ({
  HomeProducts: () => null,
}));

import { dynamic } from "@/app/page";

describe("홈 페이지 렌더링 모드", () => {
  it("빌드 시 데이터베이스를 요구하지 않도록 요청 시점에 렌더링한다", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
