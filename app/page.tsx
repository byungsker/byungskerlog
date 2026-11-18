import { Suspense } from "react";
import type { Metadata } from "next";
import { PopularPostsLoader } from "@/components/post/PopularPostsLoader";
import { PostListLoader } from "@/components/post/PostListLoader";
import { PostListSkeleton } from "@/components/skeleton/PostListSkeleton";
import { HomeProducts } from "@/components/products/HomeProducts";
import { siteConfig } from "@/lib/site-config";

// The homepage depends on live database content. Render it at request time so
// production builds do not require database connectivity and DB failures reach
// framework error handling instead of being cached as an empty list.
export const dynamic = "force-dynamic";

const siteUrl = siteConfig.url;

export const metadata: Metadata = {
  description:
    "개발자 병스커(Byungsker)의 기술 블로그. 프론트엔드(FE) 개발, React·Next.js·TypeScript, 제품 개발과 오픈소스 경험을 기록합니다.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    url: siteUrl,
  },
};

export default function Home() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              className="popular-posts-skeleton mb-10 min-h-40 rounded-xl border border-border/60 bg-muted/20 sm:mb-12"
            />
          }
        >
          <PopularPostsLoader />
        </Suspense>

        <Suspense fallback={<PostListSkeleton />}>
          <PostListLoader />
        </Suspense>

        <HomeProducts />
      </div>
    </div>
  );
}
