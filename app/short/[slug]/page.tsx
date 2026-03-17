import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PostDetailLoader } from "@/components/post/PostDetailLoader";
import { PostDetailSkeleton } from "@/components/skeleton/PostDetailSkeleton";
import { getPost } from "@/lib/post-data";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true, type: "SHORT" },
      select: { slug: true, subSlug: true },
    });

    const params: { slug: string }[] = [];

    posts.forEach((post: { slug: string; subSlug: string | null }) => {
      params.push({ slug: post.slug });
      if (post.subSlug) {
        params.push({ slug: post.subSlug });
      }
    });

    return params;
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
      creator: "@byungsker",
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ShortPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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
