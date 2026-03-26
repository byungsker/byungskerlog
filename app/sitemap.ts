import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 86400; // 24시간마다 sitemap 재생성 (DB 업데이트 반영)

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정적 페이지 URL
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/posts`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/short-posts`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    {
      url: `${siteUrl}/series`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    {
      url: `${siteUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    },
  ];

  try {
    // 게시된 Long 포스트 가져오기
    const longPosts = await prisma.post.findMany({
      where: { published: true, type: "LONG" },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Long 포스트 URL 생성
    const longPostUrls = longPosts.map((post) => ({
      url: `${siteUrl}/posts/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    // 게시된 Short 포스트 가져오기
    const shortPosts = await prisma.post.findMany({
      where: { published: true, type: "SHORT" },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Short 포스트 URL 생성
    const shortPostUrls = shortPosts.map((post) => ({
      url: `${siteUrl}/short/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // 시리즈 가져오기
    const seriesList = await prisma.series.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // 시리즈 URL 생성
    const seriesUrls = seriesList.map((series) => ({
      url: `${siteUrl}/series/${series.slug}`,
      lastModified: series.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // 태그 가져오기 (게시된 포스트가 3개 이상인 태그만 — thin content 방지)
    const tags = await prisma.tag.findMany({
      where: {
        posts: {
          some: { published: true },
        },
      },
      select: {
        name: true,
        updatedAt: true,
        _count: {
          select: {
            posts: { where: { published: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 포스트 3개 이상인 태그만 사이트맵에 포함 (thin content 페이지 제외)
    const tagUrls = tags
      .filter((tag) => tag._count.posts >= 3)
      .map((tag) => ({
        url: `${siteUrl}/tags/${encodeURIComponent(tag.name)}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));

    return [...staticPages, ...longPostUrls, ...shortPostUrls, ...seriesUrls, ...tagUrls];
  } catch {
    return staticPages;
  }
}
