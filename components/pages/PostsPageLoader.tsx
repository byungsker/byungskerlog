import { prisma } from "@/lib/prisma";
import { getPostListCacheKey } from "@/lib/post-cache";
import { unstable_cache } from "next/cache";
import { PostsPageClient } from "./PostsPageClient";

interface PostsPageLoaderProps {
  page: number;
  countOnly?: boolean;
}

const getPosts = (page: number) =>
  unstable_cache(
    async () => {
      const limit = 20;
      const skip = (page - 1) * limit;

      try {
        const [postsRaw, total] = await Promise.all([
          prisma.post.findMany({
            where: { published: true, type: "LONG" },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              content: true,
              thumbnail: true,
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
          prisma.post.count({ where: { published: true, type: "LONG" } }),
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
        console.error("[PostsPageLoader] Failed to load posts", error);
        throw error;
      }
    },
    [getPostListCacheKey("long", page)],
    { revalidate: 3600, tags: ["posts"] }
  )();

export async function PostsPageLoader({ page, countOnly }: PostsPageLoaderProps) {
  const data = await getPosts(page);

  if (countOnly) {
    return (
      <span aria-label={`총 포스트 ${data.pagination.total}개`} className="text-xl text-muted-foreground">
        {data.pagination.total}
      </span>
    );
  }

  return <PostsPageClient initialData={data} currentPage={page} />;
}
