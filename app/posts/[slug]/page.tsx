import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { PostDetailLoader } from "@/components/post/PostDetailLoader";
import { PostDetailSkeleton } from "@/components/skeleton/PostDetailSkeleton";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true, type: "LONG" },
      select: { slug: true },
    });

    return posts.map((post: { slug: string }) => ({ slug: post.slug }));
  } catch {
    return [];
  }
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

  if (postData.type === "SHORT") {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `${siteUrl}/short/${postData.slug}` },
    };
  }

  if (postData.slug !== decodedSlug) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `${siteUrl}/posts/${postData.slug}` },
    };
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
  const decodedSlug = decodeURIComponent(slug);

  const post = await prisma.post.findFirst({
    where: {
      OR: [{ slug: decodedSlug }, { subSlug: decodedSlug }],
    },
    select: { slug: true, type: true },
  });

  if (post) {
    if (post.type === "SHORT") {
      permanentRedirect(`/short/${post.slug}`);
    }
    if (post.slug !== decodedSlug) {
      permanentRedirect(`/posts/${post.slug}`);
    }
  }

  return (
    <Suspense fallback={<PostDetailSkeleton />}>
      <PostDetailLoader slug={slug} isFromShort={false} />
    </Suspense>
  );
}
