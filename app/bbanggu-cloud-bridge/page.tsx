import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Bbanggu Cloud Bridge",
  description:
    "Bbanggu Cloud Bridge는 사용자의 요청에 따라 Google Calendar, Gmail, Google Drive를 로컬 자동화 도구와 연결하는 개인용 애플리케이션입니다.",
  alternates: {
    canonical: `${siteUrl}/bbanggu-cloud-bridge`,
  },
  openGraph: {
    title: "Bbanggu Cloud Bridge",
    description:
      "사용자의 요청에 따라 Google Calendar, Gmail, Google Drive를 연결하는 개인용 애플리케이션입니다.",
    url: `${siteUrl}/bbanggu-cloud-bridge`,
  },
};

export default function BbangguCloudBridgePage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4 text-sm font-medium text-muted-foreground">Private personal integration</p>
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Bbanggu Cloud Bridge</h1>
        <p className="text-xl leading-relaxed text-muted-foreground">
          사용자의 요청에 따라 Google Calendar, Gmail, Google Drive를 로컬 자동화 도구와 연결하는 개인용
          애플리케이션입니다.
        </p>

        <div className="mt-12 space-y-10">
          <section>
            <h2 className="mb-4 text-2xl font-semibold">무엇을 하는 애플리케이션인가요?</h2>
            <p className="leading-relaxed">
              Bbanggu Cloud Bridge는 소유자가 승인한 Google 계정과 로컬 Hermes Agent 사이의 연결을
              제공합니다. 사용자가 요청한 작업에 필요한 범위에서만 Google API를 호출합니다.
            </p>
            <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed">
              <li>Google Calendar 일정 조회와 관리</li>
              <li>Gmail 메시지 검색, 읽기, 전송과 사용자 요청에 따른 수정</li>
              <li>Google Drive 파일 검색, 업로드, 생성과 사용자 요청에 따른 수정</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">데이터와 권한</h2>
            <p className="leading-relaxed">
              Google 계정의 데이터는 사용자가 OAuth 동의 화면에서 승인한 뒤에만 접근합니다. Bbanggu Cloud
              Bridge는 Google 사용자 데이터를 광고, 판매, 신용평가 또는 개인화 광고에 사용하지 않습니다.
            </p>
            <p className="mt-4 leading-relaxed">
              이 블로그는 Google API 응답을 저장하는 서버가 아닙니다. OAuth 자격 증명은 소유자의 로컬 환경에
              보관되며, Google API에서 반환된 데이터는 요청된 작업을 수행하는 데 필요한 범위에서만 처리됩니다.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">사용자 통제</h2>
            <p className="leading-relaxed">
              사용자는 Google 계정의 보안 설정에서 언제든지 이 애플리케이션의 접근 권한을 철회할 수 있습니다.
              메일 전송, 파일 삭제와 같은 외부 상태 변경 작업은 사용자의 명시적인 요청과 확인 없이 수행하지
              않습니다.
            </p>
          </section>

          <section className="border-t border-border pt-8">
            <h2 className="mb-4 text-2xl font-semibold">관련 문서</h2>
            <nav aria-label="Bbanggu Cloud Bridge 문서" className="flex flex-wrap gap-x-5 gap-y-3">
              <Link href="/privacy" className="font-medium text-primary hover:underline">
                개인정보처리방침
              </Link>
              <Link href="/terms" className="font-medium text-primary hover:underline">
                이용약관
              </Link>
              <Link href="/contact" className="font-medium text-primary hover:underline">
                문의하기
              </Link>
            </nav>
            <p className="mt-6 text-sm text-muted-foreground">
              문의: <a href="mailto:extreme0728@gmail.com" className="underline">extreme0728@gmail.com</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
