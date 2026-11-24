import { Suspense } from "react";
import type { Metadata } from "next";
import { PopularPostsLoader } from "@/components/post/PopularPostsLoader";
import { PostListLoader } from "@/components/post/PostListLoader";
import { PostListSkeleton } from "@/components/skeleton/PostListSkeleton";
import { HomeProducts } from "@/components/products/HomeProducts";
import { siteConfig, siteTitle } from "@/lib/site-config";

// The homepage depends on live database content. Render it at request time so
// production builds do not require database connectivity and DB failures reach
// framework error handling instead of being cached as an empty list.
export const dynamic = "force-dynamic";

const siteUrl = siteConfig.url;

export const metadata: Metadata = {
  description:
    "프로덕트 엔지니어 (Product Engineer) 병스커의 개발 블로그입니다. Frontend Engineer (FE)와 Software Engineer로서 Next.js·React·TypeScript, 제품 개발과 스타트업 경험을 공유합니다.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: siteTitle("프로덕트 엔지니어 (Product Engineer) 개발 블로그"),
    siteName: siteConfig.siteName,
    description:
      "프로덕트 엔지니어 (Product Engineer) 병스커의 개발 블로그입니다. Frontend Engineer (FE)와 Software Engineer로서 Next.js·React·TypeScript, 제품 개발과 스타트업 경험을 공유합니다.",
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
