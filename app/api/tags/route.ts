import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";
import { isPostIndexable } from "@/lib/content-policy";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        posts: {
          where: { published: true, slug: getPublicPostSlugFilter() },
          select: {
            content: true,
            type: true,
          },
        },
      },
      orderBy: {
        posts: {
          _count: "desc",
        },
      },
    });

    const result = tags.flatMap((tag) => {
      const count = tag.posts.filter((post) => isPostIndexable(post.type, post.content)).length;
      return count > 0 ? [{ tag: tag.name, count, id: tag.id, slug: tag.slug }] : [];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
