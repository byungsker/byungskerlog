import { Suspense } from "react";
import { PostListLoader } from "@/components/post/PostListLoader";
import { PostListSkeleton } from "@/components/skeleton/PostListSkeleton";
import { AdSense } from "@/components/seo/Adsense";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 3600;

export const metadata: Metadata = {
  description:
    "제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그. 최신 소프트웨어 개발, 제품 개발, 스타트업 관련 글을 확인하세요.",
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

        <AdSense
          adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP || ""}
          adFormat="fluid"
          adLayoutKey="-fb+5w+4e-db+86"
          className="mb-8"
        />

        <Suspense fallback={<PostListSkeleton />}>
          <PostListLoader />
        </Suspense>

        <AdSense
          adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_BOTTOM || ""}
          adFormat="fluid"
          adLayoutKey="-fb+5w+4e-db+86"
          className="mt-8"
        />
      </div>
    </div>
  );
}
