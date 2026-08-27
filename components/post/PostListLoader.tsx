import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { PostListClient } from "./PostListClient";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";

const getPosts = unstable_cache(
  async () => {
    const postsRaw = await prisma.post.findMany({
      where: { published: true, slug: getPublicPostSlugFilter() },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        content: true,
        thumbnail: true,
        tags: { select: { name: true } },
        type: true,
        createdAt: true,
        updatedAt: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    return postsRaw.map((p) => ({
      ...p,
      tags: p.tags.map((t) => t.name),
    }));
  },
  ["home-posts"],
  { revalidate: 3600, tags: ["posts"] }
);

export async function PostListLoader() {
  const posts = await getPosts();
  return <PostListClient initialData={posts} />;
}
