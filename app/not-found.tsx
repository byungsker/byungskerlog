import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Byungsker Log",
  description: "요청하신 페이지를 찾을 수 없습니다.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="not-found-layout flex min-h-[60vh] items-center justify-center">
      <div className="not-found-content text-center space-y-6 p-8">
        <div className="text-8xl font-bold text-muted-foreground/30">404</div>
        <h1 className="text-2xl font-bold text-foreground">페이지를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <div className="not-found-actions flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href="/posts"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            글 목록 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
