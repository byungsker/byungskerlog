import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { format } from "date-fns";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { calculateReadingTime } from "@/lib/reading-time";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

interface SeriesDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getSeriesBySlug(slug: string) {
  try {
    const decodedSlug = decodeURIComponent(slug);
    const series = await prisma.series.findUnique({
      where: { slug: decodedSlug },
      include: {
        posts: {
          where: { published: true },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            content: true,
            thumbnail: true,
            tags: true,
            createdAt: true,
          },
        },
      },
    });
    return series;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: SeriesDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  return {
    title: `${series.name} 시리즈 | Byungsker Log`,
    description: series.description || `${series.name} 시리즈의 포스트 목록입니다.`,
    alternates: {
      canonical: `${siteUrl}/series/${series.slug}`,
    },
    openGraph: {
      title: `${series.name} 시리즈 | Byungsker Log`,
      description: series.description || `${series.name} 시리즈의 포스트 목록입니다.`,
      url: `${siteUrl}/series/${series.slug}`,
    },
  };
}

export default async function SeriesDetailPage({ params }: SeriesDetailPageProps) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <nav className="series-nav mb-6">
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <Link href="/series">
              <ArrowLeft className="h-4 w-4" />
              모든 시리즈
            </Link>
          </Button>
        </nav>

        <header className="series-detail-header mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge
              variant="secondary"
              className="series-badge bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              시리즈
            </Badge>
            <span className="text-sm text-muted-foreground">{series.posts.length}개의 포스트</span>
          </div>
          <h1 className="text-4xl font-bold">{series.name}</h1>
          {series.description && <p className="text-muted-foreground mt-3 text-lg">{series.description}</p>}
        </header>

        {series.posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">이 시리즈에 등록된 포스트가 없습니다.</p>
        ) : (
          <section className="series-posts-list space-y-4">
            {series.posts.map((post, index) => (
              <Link key={post.id} href={`/posts/${post.slug}`} className="block group">
                <Card className="series-post-card overflow-hidden border-border/40 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 group-hover:border-primary/50">
                  <div className="flex flex-col sm:flex-row">
                    <div className="series-post-thumbnail relative w-full sm:w-48 h-32 sm:h-auto overflow-hidden bg-muted shrink-0">
                      {post.thumbnail ? (
                        <Image
                          src={post.thumbnail}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, 192px"
                        />
                      ) : (
                        <div className="default-thumbnail absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Image
                            src="/logo-byungsker.png"
                            alt="Default thumbnail"
                            width={80}
                            height={37}
                            className="opacity-50"
                          />
                        </div>
                      )}
                    </div>
                    <div className="series-post-content flex-1 p-4 sm:p-5">
                      <CardHeader className="p-0 pb-2">
                        <div className="series-post-meta flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.createdAt), "yyyy.MM.dd")}
                          </span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">{calculateReadingTime(post.content)}</span>
                        </div>
                        <CardTitle className="text-lg font-bold line-clamp-1 group-hover:text-primary transition-colors">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <CardDescription className="line-clamp-2">{post.excerpt || ""}</CardDescription>
                      </CardContent>
                      <CardFooter className="p-0 pt-3">
                        <span className="text-sm font-medium text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Read more
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </span>
                      </CardFooter>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
