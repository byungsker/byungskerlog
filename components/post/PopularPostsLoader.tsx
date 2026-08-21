import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createCalendarDate, HISTORICAL_POPULAR_POSTS } from "@/lib/home-popular-posts";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";
import { getDistinctPostViewCounts } from "@/lib/analytics/post-view-stats";
import { PopularPosts } from "./PopularPosts";

const getPopularPosts = unstable_cache(
  async () => {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        type: "LONG",
        slug: { in: HISTORICAL_POPULAR_POSTS.map((post) => post.slug), ...getPublicPostSlugFilter() },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        createdAt: true,
      },
    });

    const viewCounts = await getDistinctPostViewCounts(posts.map((post) => post.id));
    const viewCountByPostId = new Map(viewCounts.map((view) => [view.postId, view.count]));
    const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
    const seedOrder = new Map(HISTORICAL_POPULAR_POSTS.map((post, index) => [post.slug, index]));

    return HISTORICAL_POPULAR_POSTS.map((seed) => {
      const post = postsBySlug.get(seed.slug);

      return {
        id: seed.slug,
        href: post ? `/posts/${post.slug}` : seed.legacyUrl,
        title: seed.title,
        createdAt: createCalendarDate(seed.publishedAt),
        viewCount: post ? viewCountByPostId.get(post.id) ?? 0 : 0,
        isBaseline: !post,
      };
    }).sort((a, b) => b.viewCount - a.viewCount || seedOrder.get(a.id)! - seedOrder.get(b.id)!);
  },
  ["home-historical-popular-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function PopularPostsLoader() {
  return <PopularPosts posts={await getPopularPosts()} />;
}
