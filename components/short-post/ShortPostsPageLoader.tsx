import { prisma } from "@/lib/prisma";
import { getPostListCacheKey } from "@/lib/post-cache";
import { unstable_cache } from "next/cache";
import { ShortPostsPageClient } from "./ShortPostsPageClient";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";

interface ShortPostsPageLoaderProps {
  page: number;
  countOnly?: boolean;
}

const getShortPosts = (page: number) =>
  unstable_cache(
    async () => {
      const limit = 20;
      const skip = (page - 1) * limit;

      try {
        const [postsRaw, total] = await Promise.all([
          prisma.post.findMany({
            where: { published: true, type: "SHORT", slug: getPublicPostSlugFilter() },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              content: true,
              tags: { select: { name: true } },
              createdAt: true,
              series: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
            },
          }),
          prisma.post.count({ where: { published: true, type: "SHORT", slug: getPublicPostSlugFilter() } }),
        ]);

        const posts = postsRaw.map((p) => ({
          ...p,
          tags: p.tags.map((t) => t.name),
        }));

        return {
          posts,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        console.error("[ShortPostsPageLoader] Failed to load short posts", error);
        throw error;
      }
    },
    [getPostListCacheKey("short", page)],
    { revalidate: 3600, tags: ["posts", "short-posts"] }
  )();

export async function ShortPostsPageLoader({ page, countOnly }: ShortPostsPageLoaderProps) {
  const data = await getShortPosts(page);

  if (countOnly) {
    return (
      <span aria-label={`총 Shorts ${data.pagination.total}개`} className="text-xl text-muted-foreground">
        {data.pagination.total}
      </span>
    );
  }

  return <ShortPostsPageClient initialData={data} currentPage={page} />;
}
