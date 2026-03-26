import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostDetailLoader } from "@/components/post/PostDetailLoader";
import { PostDetailSkeleton } from "@/components/skeleton/PostDetailSkeleton";

export const revalidate = 3600;
export const dynamicParams = true; // 빌드에 없는 slug도 ISR로 처리

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  // 빌드 시 프리렌더링 스킵 → 첫 접속 시 ISR 생성 (Neon 무료 티어 OOM 방지)
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

  const post = { ...postData, tags: postData.tags.map((t) => t.name) };
  const canonicalUrl = `${siteUrl}/posts/${post.slug}`;
  const ogImageUrl = `${siteUrl}/posts/${encodeURIComponent(post.slug)}/opengraph-image`;
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
      creator: "@byungsker",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailLoader slug={slug} isFromShort={false} />
    </Suspense>
  );
}
