import { Suspense } from "react";
import { ShortPostsPageLoader } from "@/components/short-post/ShortPostsPageLoader";
import { ShortPostsSkeleton } from "@/components/skeleton/ShortPostsSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { isPostIndexable } from "@/lib/content-policy";
import { getPublicPostSlugFilter } from "@/lib/public-post-policy";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const posts = await prisma.post.findMany({
    where: { published: true, type: "SHORT", slug: getPublicPostSlugFilter() },
    select: { content: true },
  });
  const shouldIndex = posts.filter((post) => isPostIndexable("SHORT", post.content)).length >= 3;

  return {
    title: "Short Posts | Byungsker Log",
    description: "링크드인 스타일의 짧은 생각과 인사이트를 공유합니다. 개발, 제품, 스타트업에 대한 간결한 이야기들.",
    alternates: {
      canonical: `${siteUrl}/short-posts`,
    },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: "Short Posts | Byungsker Log",
      description: "링크드인 스타일의 짧은 생각과 인사이트를 공유합니다.",
      url: `${siteUrl}/short-posts`,
    },
  };
}

interface ShortPostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ShortPostsPage({ searchParams }: ShortPostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="short-posts-header flex items-baseline gap-3 mb-8">
          <h1 className="text-4xl font-bold">Shorts</h1>
          <Suspense fallback={<Skeleton className="h-7 w-8" />}>
            <ShortPostsPageLoader page={page} countOnly />
          </Suspense>
        </div>
        <p className="short-posts-import-note mb-8 text-sm text-muted-foreground">
          LinkedIn 글은 계정 소유자가 확인한 원문 또는 승인된 내보내기 데이터에서 가져옵니다.
        </p>
        <Suspense fallback={<ShortPostsSkeleton />}>
          <ShortPostsPageLoader page={page} />
        </Suspense>
      </div>
    </div>
  );
}
