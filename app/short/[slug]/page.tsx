import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { PostDetailLoader } from "@/components/post/PostDetailLoader";
import { PostDetailSkeleton } from "@/components/skeleton/PostDetailSkeleton";
import { getPost } from "@/lib/post-data";
import { siteConfig } from "@/lib/site-config";
import { isPostIndexable } from "@/lib/content-policy";

export const revalidate = 3600;
export const dynamicParams = true; // 빌드에 없는 slug도 ISR로 처리

const siteUrl = siteConfig.url;

export async function generateStaticParams() {
  // 빌드 시 프리렌더링 스킵 → 첫 접속 시 ISR 생성 (Neon 무료 티어 OOM 방지)
  // subSlug 접근은 런타임 redirect 로직으로 처리됨
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const postData = await prisma.post.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
    include: {
      tags: { select: { name: true } },
    },
  });

  if (!postData) {
    notFound();
  }

  if (postData.slug !== decodedSlug) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `${siteUrl}/short/${postData.slug}` },
    };
  }

  const isThin = !isPostIndexable("SHORT", postData.content);

  const post = { ...postData, tags: postData.tags.map((t) => t.name) };
  const canonicalUrl = `${siteUrl}/short/${post.slug}`;
  const ogImageUrl = `${siteUrl}/short/${encodeURIComponent(post.slug)}/opengraph-image`;
  const description = post.excerpt || post.content.replace(/[#*`\n]/g, "").substring(0, 200) + "...";

  return {
    title: `${post.title} written by Byungsker`,
    description,
    keywords: post.tags,
    authors: [{ name: "병스커 (Byungsker)" }],
    openGraph: {
      type: "article",
      locale: "ko_KR",
      alternateLocale: ["en_US"],
      url: canonicalUrl,
      siteName: "Byungsker Log",
      title: `${post.title} written by Byungsker`,
      description,
      publishedTime: post.createdAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: ["병스커 (Byungsker)"],
      tags: post.tags || [],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} written by Byungsker`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    ...(isThin && { robots: { index: false, follow: true } }),
  };
}

export default async function ShortPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  const baseMatch = await prisma.post.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
    select: { slug: true, type: true },
  });

  if (baseMatch && baseMatch.slug !== decodedSlug) {
    permanentRedirect(`/short/${baseMatch.slug}`);
  }

  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  if (post.type !== "SHORT") {
    notFound();
  }

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailLoader slug={slug} isFromShort={true} />
    </Suspense>
  );
}
