import { Suspense } from "react";
import { ShortPostsPageLoader } from "@/components/short-post/ShortPostsPageLoader";
import { ShortPostsSkeleton } from "@/components/skeleton/ShortPostsSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Short Posts | Byungsker Log",
  description: "링크드인 스타일의 짧은 생각과 인사이트를 공유합니다. 개발, 제품, 스타트업에 대한 간결한 이야기들.",
  alternates: {
    canonical: `${siteUrl}/short-posts`,
  },
  openGraph: {
    title: "Short Posts | Byungsker Log",
    description: "링크드인 스타일의 짧은 생각과 인사이트를 공유합니다.",
    url: `${siteUrl}/short-posts`,
  },
};

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
        <Suspense fallback={<ShortPostsSkeleton />}>
          <ShortPostsPageLoader page={page} />
        </Suspense>
      </div>
    </div>
  );
}
