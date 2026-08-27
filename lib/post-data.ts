import { prisma } from "@/lib/prisma";

export async function getPost(slug: string) {
  const decodedSlug = decodeURIComponent(slug);
  const postData = await prisma.post.findFirst({
    where: {
      published: true,
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
    include: {
      series: true,
      tags: { select: { name: true } },
      linkedShortPost: {
        select: { slug: true, title: true },
      },
      linkedLongPost: {
        select: { slug: true, title: true },
      },
    },
  });

  if (!postData) return null;
  return {
    ...postData,
    tags: postData.tags.map((t) => t.name),
  };
}

export async function getSeriesPosts(seriesId: string | null) {
  if (!seriesId) return [];

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      seriesId,
    },
    orderBy: { createdAt: "asc" },
    select: { slug: true, title: true, createdAt: true },
  });

  return posts;
}

export async function getPrevNextPosts(
  createdAt: Date,
  seriesId: string | null,
  currentSlug: string,
  filterByShortType: boolean
) {
  const typeFilter = filterByShortType ? { type: "SHORT" as const } : {};

  if (seriesId) {
    const seriesPosts = await prisma.post.findMany({
      where: { published: true, seriesId, ...typeFilter },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true, createdAt: true },
    });

    const currentIndex = seriesPosts.findIndex((p) => p.slug === currentSlug);

    let prevPost = null;
    let nextPost = null;

    if (currentIndex > 0) {
      prevPost = seriesPosts[currentIndex - 1];
    } else {
      prevPost = await prisma.post.findFirst({
        where: { published: true, createdAt: { lt: createdAt }, ...typeFilter },
        orderBy: { createdAt: "desc" },
        select: { slug: true, title: true },
      });
    }

    if (currentIndex < seriesPosts.length - 1) {
      nextPost = seriesPosts[currentIndex + 1];
    } else {
      nextPost = await prisma.post.findFirst({
        where: { published: true, createdAt: { gt: createdAt }, ...typeFilter },
        orderBy: { createdAt: "asc" },
        select: { slug: true, title: true },
      });
    }

    return { prevPost, nextPost };
  }

  const [prevPost, nextPost] = await Promise.all([
    prisma.post.findFirst({
      where: { published: true, createdAt: { lt: createdAt }, ...typeFilter },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: { published: true, createdAt: { gt: createdAt }, ...typeFilter },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return { prevPost, nextPost };
}

export async function getRelatedPosts(tags: string[], currentSlug: string, filterByShortType: boolean) {
  if (!tags || tags.length === 0) return [];

  const typeFilter = filterByShortType ? { type: "SHORT" as const } : {};

  const postsData = await prisma.post.findMany({
    where: {
      published: true,
      slug: { not: currentSlug },
      tags: { some: { name: { in: tags } } },
      ...typeFilter,
    },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      createdAt: true,
      tags: { select: { name: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return postsData.map((post) => ({
    ...post,
    tags: post.tags.map((t) => t.name),
  }));
}

export async function getShortPostsNav(createdAt: Date, currentSlug: string, postType: string) {
  if (postType !== "SHORT") return { prevShortPost: null, nextShortPost: null };

  const [prevShortPost, nextShortPost] = await Promise.all([
    prisma.post.findFirst({
      where: {
        published: true,
        type: "SHORT",
        slug: { not: currentSlug },
        createdAt: { lt: createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { slug: true, title: true },
    }),
    prisma.post.findFirst({
      where: {
        published: true,
        type: "SHORT",
        slug: { not: currentSlug },
        createdAt: { gt: createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return { prevShortPost, nextShortPost };
}

export type Post = NonNullable<Awaited<ReturnType<typeof getPost>>>;
export type SeriesPost = Awaited<ReturnType<typeof getSeriesPosts>>[number];
export type RelatedPost = Awaited<ReturnType<typeof getRelatedPosts>>[number];
export type PrevNextPost = { slug: string; title: string } | null;
