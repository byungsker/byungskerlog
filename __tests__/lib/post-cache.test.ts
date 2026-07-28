import { describe, expect, it } from "vitest";
import { getPostListCacheKey, POST_LIST_CACHE_VERSION } from "@/lib/post-cache";

describe("post list cache keys", () => {
  it("versions long and short list keys so poisoned empty entries are bypassed", () => {
    expect(getPostListCacheKey("long", 1)).toBe(`posts-page-${POST_LIST_CACHE_VERSION}-1`);
    expect(getPostListCacheKey("short", 2)).toBe(`short-posts-page-${POST_LIST_CACHE_VERSION}-2`);
  });
});
