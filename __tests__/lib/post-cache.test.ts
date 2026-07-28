import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRevalidateTag } = vi.hoisted(() => ({
  mockRevalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
}));

import {
  getPostListCacheKey,
  POST_LIST_CACHE_VERSION,
  revalidatePostListCaches,
} from "@/lib/post-cache";

describe("게시글 목록 캐시", () => {
  beforeEach(() => {
    mockRevalidateTag.mockReset();
  });

  it("오염된 빈 항목을 우회하도록 긴 글과 짧은 글 키에 버전을 포함한다", () => {
    expect(getPostListCacheKey("long", 1)).toBe(`posts-page-${POST_LIST_CACHE_VERSION}-1`);
    expect(getPostListCacheKey("short", 2)).toBe(`short-posts-page-${POST_LIST_CACHE_VERSION}-2`);
  });

  it("긴 글과 짧은 글 목록 태그를 모두 무효화한다", () => {
    revalidatePostListCaches();

    expect(mockRevalidateTag).toHaveBeenCalledTimes(2);
    expect(mockRevalidateTag).toHaveBeenCalledWith("posts", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("short-posts", "max");
  });
});
