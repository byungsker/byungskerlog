import { Suspense } from "react";
import { PostsPageLoader } from "@/components/pages/PostsPageLoader";
import { PostsListSkeleton } from "@/components/skeleton/PostsListSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Posts | Byungsker Log",
  description:
    "소프트웨어 개발, 제품 개발, 스타트업에 대한 모든 포스트를 확인하세요. 제품 주도 개발을 지향하는 개발자의 인사이트를 공유합니다.",
  alternates: {
    canonical: `${siteUrl}/posts`,
  },
  openGraph: {
    title: "Posts | Byungsker Log",
    description: "소프트웨어 개발, 제품 개발, 스타트업에 대한 모든 포스트를 확인하세요.",
    url: `${siteUrl}/posts`,
  },
};

interface PostsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="posts-header flex items-baseline gap-3 mb-8">
          <h1 className="text-4xl font-bold">Posts</h1>
          <Suspense fallback={<Skeleton className="h-7 w-8" />}>
            <PostsPageLoader page={page} countOnly />
          </Suspense>
        </div>
        <Suspense fallback={<PostsListSkeleton />}>
          <PostsPageLoader page={page} />
        </Suspense>
      </div>
    </div>
  );
}
