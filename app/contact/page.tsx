import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "문의하기 | Byungsker Log",
  description:
    "Byungsker Log 운영자에게 문의하세요. 블로그 콘텐츠, 협업 제안, 기술 질문 등 무엇이든 편하게 연락해 주세요.",
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title: "문의하기 | Byungsker Log",
    description: "Byungsker Log 운영자에게 문의하세요.",
    url: `${siteUrl}/contact`,
  },
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">문의하기</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed">
          <p>
            Byungsker Log에 대한 문의사항이 있으시면 아래 연락처를 통해 편하게 연락해 주세요. 블로그 콘텐츠, 협업 제안,
            기술 질문 등 어떤 내용이든 환영합니다.
          </p>
        </div>

        <div className="contact-cards mt-8 grid gap-6 sm:grid-cols-2">
          <div className="contact-card rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">이메일</h2>
            <p className="text-muted-foreground mb-4">일반적인 문의에 가장 빠르게 응답합니다.</p>
            <a href="mailto:byungsker@gmail.com" className="text-primary hover:underline font-medium">
              byungsker@gmail.com
            </a>
          </div>

          <div className="contact-card rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">GitHub</h2>
            <p className="text-muted-foreground mb-4">코드 관련 문의나 오픈소스 협업은 GitHub를 통해 연락해 주세요.</p>
            <a
              href="https://github.com/byungsker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              github.com/byungsker
            </a>
          </div>

          <div className="contact-card rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">LinkedIn</h2>
            <p className="text-muted-foreground mb-4">커리어 관련 제안이나 네트워킹은 LinkedIn으로 연락해 주세요.</p>
            <a
              href="https://linkedin.com/in/byungsker"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              linkedin.com/in/byungsker
            </a>
          </div>

          <div className="contact-card rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">블로그 피드백</h2>
            <p className="text-muted-foreground mb-4">블로그 글에 대한 피드백이나 오류 제보는 언제든 환영합니다.</p>
            <a
              href="https://github.com/byungsker/byungskerlog/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              GitHub Issues
            </a>
          </div>
        </div>

        <div className="contact-note mt-8 rounded-lg border border-border bg-muted/50 p-6">
          <h3 className="text-base font-semibold mb-2">응답 안내</h3>
          <p className="text-sm text-muted-foreground">
            문의 내용에 따라 1~3일 이내에 회신드립니다. 급한 문의는 이메일을 이용해 주세요. 스팸 또는 광고 목적의
            문의에는 응답하지 않을 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
