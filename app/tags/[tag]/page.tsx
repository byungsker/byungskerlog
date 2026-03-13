import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { PostsListSkeleton } from "@/components/skeleton/PostsListSkeleton";
import type { Metadata } from "next";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export async function generateStaticParams() {
  try {
    const tags = await prisma.tag.findMany({
      where: {
        posts: {
          some: { published: true },
        },
      },
      select: { name: true },
    });

    return tags.map((tag) => ({
      tag: encodeURIComponent(tag.name),
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  const tagData = await prisma.tag.findUnique({
    where: { name: decodedTag },
    include: {
      _count: {
        select: {
          posts: { where: { published: true } },
        },
      },
    },
  });

  if (!tagData) {
    return {
      title: "Tag not found",
    };
  }

  const title = `${decodedTag} | Tags | Byungsker Log`;
  const description = `"${decodedTag}" 태그가 붙은 ${tagData._count.posts}개의 포스트를 확인하세요. 병스커의 기술 블로그에서 관련 글을 탐색해보세요.`;

  const shouldIndex = tagData._count.posts >= 3;

  return {
    title,
    description,
    keywords: [decodedTag, "기술블로그", "개발블로그", "병스커", "Byungsker"],
    alternates: {
      canonical: `${siteUrl}/tags/${encodeURIComponent(decodedTag)}`,
    },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/tags/${encodeURIComponent(decodedTag)}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

async function getPostsByTag(tagName: string) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        tags: {
          some: { name: tagName },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        type: true,
        createdAt: true,
        tags: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return posts.map((post) => ({
      ...post,
      tags: post.tags.map((t) => t.name),
    }));
  } catch {
    return [];
  }
}

async function TagPageContent({ tag }: { tag: string }) {
  const decodedTag = decodeURIComponent(tag);
  const posts = await getPostsByTag(decodedTag);

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={post.type === "SHORT" ? `/short/${post.slug}` : `/posts/${post.slug}`}
          className="group"
        >
          <Card className="transition-colors hover:border-primary">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {post.type === "SHORT" && (
                    <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">Short</span>
                  )}
                  <time className="text-sm text-muted-foreground" dateTime={post.createdAt.toISOString()}>
                    {format(post.createdAt, "MMMM d, yyyy")}
                  </time>
                </div>
              </div>
              <CardTitle className="text-2xl group-hover:text-primary transition-colors">{post.title}</CardTitle>
              {post.excerpt && <CardDescription className="line-clamp-2 text-base">{post.excerpt}</CardDescription>}
            </CardHeader>
            {post.tags && post.tags.length > 0 && (
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tagName) => (
                    <span
                      key={tagName}
                      className={`px-2 py-1 rounded text-xs ${
                        tagName === decodedTag ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      }`}
                    >
                      {tagName}
                    </span>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/tags"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tags
          </Link>
          <h1 className="text-4xl font-bold">#{decodedTag}</h1>
        </div>
        <Suspense fallback={<PostsListSkeleton />}>
          <TagPageContent tag={tag} />
        </Suspense>
      </div>
    </div>
  );
}
