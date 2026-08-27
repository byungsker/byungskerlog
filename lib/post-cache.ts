import { revalidateTag } from "next/cache";

export const POST_LIST_CACHE_VERSION = "v2";

export function getPostListCacheKey(kind: "long" | "short", page: number): string {
  const prefix = kind === "short" ? "short-posts" : "posts";
  return `${prefix}-page-${POST_LIST_CACHE_VERSION}-${page}`;
}

export function revalidatePostListCaches(): void {
  revalidateTag("posts", "max");
  revalidateTag("short-posts", "max");
}
