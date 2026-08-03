import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { BookOpen, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { format } from "date-fns";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "Series | Byungsker Log",
  description: "연재 시리즈 목록입니다. 관련 포스트를 시리즈별로 묶어서 순서대로 읽을 수 있습니다.",
  alternates: {
    canonical: `${siteUrl}/series`,
  },
  openGraph: {
    title: "Series | Byungsker Log",
    description: "연재 시리즈 목록입니다. 관련 포스트를 시리즈별로 묶어서 순서대로 읽을 수 있습니다.",
    url: `${siteUrl}/series`,
  },
};

async function getSeries() {
  try {
    const series = await prisma.series.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        posts: {
          where: { published: true, slug: getPublicPostSlugFilter() },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        _count: {
          select: {
            posts: {
              where: { published: true, slug: getPublicPostSlugFilter() },
            },
          },
        },
      },
    });
    return series;
  } catch {
    return [];
  }
}

export default async function SeriesPage() {
  const seriesList = await getSeries();

  if (seriesList.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Series</h1>
          <p className="text-muted-foreground text-center py-20">아직 등록된 시리즈가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <header className="series-header mb-8">
          <h1 className="text-4xl font-bold">Series</h1>
          <p className="text-muted-foreground mt-2">
            연재 시리즈 목록입니다. 관련 포스트를 시리즈별로 묶어서 순서대로 읽을 수 있습니다.
          </p>
        </header>

        <section className="series-grid grid grid-cols-1 md:grid-cols-2 gap-6">
          {seriesList.map((series) => (
            <Link key={series.id} href={`/series/${series.slug}`} className="block group">
              <Card className="series-card h-full overflow-hidden border-border/40 bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 group-hover:border-emerald-500/50">
                <CardHeader className="pb-3">
                  <div className="series-card-meta flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="series-badge bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      시리즈
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold group-hover:text-emerald-500 transition-colors">
                    {series.name}
                  </CardTitle>
                  {series.description && (
                    <CardDescription className="line-clamp-2 mt-2">{series.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="series-card-stats flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {series._count.posts}개의 포스트
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(series.updatedAt), "yyyy.MM.dd")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
