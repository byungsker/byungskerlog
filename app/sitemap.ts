import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { companyProducts } from "@/lib/product-data";
import { siteConfig } from "@/lib/site-config";
import { isPostIndexable } from "@/lib/content-policy";
import { getPublicPostSlugFilter, isPublicPostSlug } from "@/lib/public-post-policy";

export const revalidate = 86400; // 24시간마다 sitemap 재생성 (DB 업데이트 반영)

const siteUrl = siteConfig.url;

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
      url: `${siteUrl}/bbanggu-cloud-bridge`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.4,
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
  const productPages = companyProducts.map((product) => ({
    url: `${siteUrl}/products/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  try {
    // 게시된 Long 포스트 가져오기
    const longPosts = await prisma.post.findMany({
      where: { published: true, type: "LONG", slug: getPublicPostSlugFilter() },
      select: {
        slug: true,
        content: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Long 포스트 URL 생성
    const longPostUrls = longPosts
      .filter((post) => isPublicPostSlug(post.slug) && isPostIndexable("LONG", post.content))
      .map((post) => ({
        url: `${siteUrl}/posts/${post.slug}`,
        lastModified: post.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    // 게시된 Short 포스트 가져오기
    const shortPosts = await prisma.post.findMany({
      where: { published: true, type: "SHORT", slug: getPublicPostSlugFilter() },
      select: {
        slug: true,
        content: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Short 포스트 URL 생성
    const indexableShortPosts = shortPosts.filter(
      (post) => isPublicPostSlug(post.slug) && isPostIndexable("SHORT", post.content)
    );
    const shortPostUrls = indexableShortPosts.map((post) => ({
      url: `${siteUrl}/short/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    const shortPostsPage =
      indexableShortPosts.length >= 3
        ? [
            {
              url: `${siteUrl}/short-posts`,
              lastModified: indexableShortPosts[0]?.updatedAt ?? new Date(),
              changeFrequency: "daily" as const,
              priority: 0.8,
            },
          ]
        : [];

    // 시리즈 가져오기
    const seriesList = await prisma.series.findMany({
      select: {
        slug: true,
        updatedAt: true,
        posts: {
          where: { published: true, slug: getPublicPostSlugFilter() },
          select: {
            content: true,
            type: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 시리즈 URL 생성
    const seriesUrls = seriesList
      .filter((series) => series.posts.filter((post) => isPostIndexable(post.type, post.content)).length >= 2)
      .map((series) => ({
        url: `${siteUrl}/series/${series.slug}`,
        lastModified: series.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    // 태그 가져오기 (게시된 포스트가 3개 이상인 태그만 — thin content 방지)
    const tags = await prisma.tag.findMany({
      where: {
        posts: {
          some: { published: true, slug: getPublicPostSlugFilter() },
        },
      },
      select: {
        name: true,
        updatedAt: true,
        posts: {
          where: { published: true, slug: getPublicPostSlugFilter() },
          select: {
            content: true,
            type: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 포스트 3개 이상인 태그만 사이트맵에 포함 (thin content 페이지 제외)
    const tagUrls = tags
      .filter((tag) => tag.posts.filter((post) => isPostIndexable(post.type, post.content)).length >= 3)
      .map((tag) => ({
        url: `${siteUrl}/tags/${encodeURIComponent(tag.name)}`,
        lastModified: tag.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.5,
      }));

    return [
      ...staticPages,
      ...shortPostsPage,
      ...productPages,
      ...longPostUrls,
      ...shortPostUrls,
      ...seriesUrls,
      ...tagUrls,
    ];
  } catch {
    return [...staticPages, ...productPages];
  }
}
