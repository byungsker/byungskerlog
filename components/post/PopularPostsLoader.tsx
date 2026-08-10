import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { HISTORICAL_POPULAR_POSTS } from "@/lib/home-popular-posts";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";
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
        _count: { select: { views: true } },
      },
    });

    const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

    return HISTORICAL_POPULAR_POSTS.map((seed) => {
      const post = postsBySlug.get(seed.slug);

      return {
        id: seed.slug,
        href: post ? `/posts/${post.slug}` : seed.legacyUrl,
        title: seed.title,
        createdAt: new Date(`${seed.publishedAt}T00:00:00.000Z`),
        viewCount: post?._count.views ?? 0,
        isBaseline: !post,
      };
    });
  },
  ["home-historical-popular-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function PopularPostsLoader() {
  return <PopularPosts posts={await getPopularPosts()} />;
}
