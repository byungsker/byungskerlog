import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "이용약관 | Bbanggu Cloud Bridge",
  description:
    "Byungsker Log와 Bbanggu Cloud Bridge의 서비스 이용 조건, Google API 연동, 지적재산권과 면책 조항을 안내합니다.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    title: "이용약관 | Bbanggu Cloud Bridge",
    description: "Byungsker Log와 Bbanggu Cloud Bridge의 이용약관입니다.",
    url: `${siteUrl}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">이용약관</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert prose-p:leading-relaxed prose-li:leading-relaxed">
          <p className="mb-8 text-muted-foreground">최종 수정일: 2026년 9월 4일</p>

          <p>
            본 이용약관은 Byungsker Log(이하 &ldquo;본 사이트&rdquo;)와 Bbanggu Cloud Bridge(이하 &ldquo;본 애플리케이션&rdquo;)의
            이용 조건을 규정합니다. 본 사이트나 본 애플리케이션을 이용하는 경우 본 약관에 동의하는 것으로
            간주됩니다.
          </p>

          <h2>1. Bbanggu Cloud Bridge 서비스</h2>
          <p>
            Bbanggu Cloud Bridge는 소유자의 요청에 따라 Google Calendar, Gmail, Google Drive와 로컬 자동화
            도구를 연결하는 개인용 애플리케이션입니다. 본 애플리케이션은 공개형 다중 사용자 SaaS가 아니며,
            사용자가 승인한 Google 계정의 데이터에만 접근합니다.
          </p>
          <ul>
            <li>Google Calendar 일정 조회와 관리</li>
            <li>Gmail 메시지 검색, 읽기, 전송과 사용자 요청에 따른 수정</li>
            <li>Google Drive 파일 검색, 업로드, 생성과 사용자 요청에 따른 수정</li>
          </ul>

          <h2>2. Google 계정과 외부 서비스</h2>
          <p>
            본 애플리케이션을 사용하려면 Google OAuth 동의가 필요합니다. 이용자는 요청되는 권한을 확인한 뒤
            직접 승인하며, Google 계정의 접근 권한을 언제든지 철회할 수 있습니다.
          </p>
          <p>
            Google API와 Google 계정은 Google의 약관과 정책을 따릅니다. 본 사이트와 본 애플리케이션은 Google의
            공식 제품이나 공식 지원 서비스가 아닙니다.
          </p>

          <h2>3. 이용자의 책임</h2>
          <ul>
            <li>이용자는 본인이 소유하거나 사용할 권한이 있는 Google 계정만 연결해야 합니다.</li>
            <li>이용자는 Google API 정책과 관련 법률을 준수해야 합니다.</li>
            <li>이용자는 메일 전송, 파일 생성, 파일 수정과 같은 작업의 대상과 내용을 확인할 책임이 있습니다.</li>
            <li>타인의 개인정보, 저작권, 보안 또는 서비스 이용을 침해하는 방식으로 사용할 수 없습니다.</li>
          </ul>
          <p>
            메일 전송, 파일 삭제와 같은 외부 상태 변경 작업은 사용자의 명시적인 요청과 확인 없이 수행하지
            않습니다.
          </p>

          <h2>4. 본 사이트의 콘텐츠</h2>
          <p>
            본 사이트는 소프트웨어 개발, 제품 개발, 스타트업 등에 관한 기술 글, 튜토리얼, 프로젝트 소개와
            관련 콘텐츠를 제공합니다. 모든 콘텐츠는 정보 제공 목적으로 작성됩니다.
          </p>

          <h2>5. 지적재산권</h2>
          <p>
            본 사이트에 게시된 텍스트, 이미지, 코드와 기타 콘텐츠는 별도의 라이선스 표기가 없는 한 운영자에게
            저작권이 있습니다.
          </p>
          <ul>
            <li>개인적 학습과 연구 목적의 이용은 허용합니다.</li>
            <li>비상업적 공유는 출처를 명시하는 경우 허용합니다.</li>
            <li>상업적 복제, 배포와 수정은 사전 서면 동의가 필요합니다.</li>
            <li>코드 예시는 별도 라이선스 표기가 있으면 해당 라이선스를 따릅니다.</li>
          </ul>

          <h2>6. 댓글과 사용자 콘텐츠</h2>
          <p>댓글 등 사용자 콘텐츠를 작성하는 경우 다음 사항을 준수해야 합니다.</p>
          <ul>
            <li>타인을 비방하거나 모욕하는 내용 금지</li>
            <li>스팸과 광고 목적의 댓글 금지</li>
            <li>타인의 저작권을 침해하는 내용 금지</li>
            <li>불법적이거나 유해한 내용 금지</li>
          </ul>
          <p>위반 콘텐츠는 사전 통보 없이 삭제될 수 있습니다.</p>

          <h2>7. 광고와 외부 링크</h2>
          <p>
            본 사이트는 Google AdSense를 통해 광고를 게재할 수 있습니다. 광고 내용은 운영자가 직접 통제하지
            않으며, 외부 링크의 내용과 서비스에 대해서도 운영자는 책임을 지지 않습니다.
          </p>

          <h2>8. 면책 조항</h2>
          <p>
            본 사이트의 콘텐츠와 본 애플리케이션은 정보 제공과 개인 자동화 목적으로 제공됩니다. 운영자는
            콘텐츠와 외부 API가 항상 정확하거나 중단 없이 작동한다고 보장하지 않습니다.
          </p>
          <ul>
            <li>Google API, Google 계정 또는 외부 서비스의 장애와 정책 변경에 대해 책임지지 않습니다.</li>
            <li>이용자가 본 사이트의 정보나 본 애플리케이션의 결과를 사용해 내린 결정에 대해 책임지지 않습니다.</li>
            <li>기술 콘텐츠는 작성 시점과 환경에 따라 현재 동작과 다를 수 있습니다.</li>
          </ul>

          <h2>9. 서비스 변경과 중단</h2>
          <p>
            운영자는 사이트 콘텐츠와 애플리케이션 기능을 변경하거나, 기술적·운영상의 사유로 서비스를 일시적 또는
            영구적으로 중단할 수 있습니다.
          </p>

          <h2>10. 약관 변경과 문의</h2>
          <p>
            본 약관은 필요에 따라 변경될 수 있으며 변경 시 본 페이지에 게시합니다. 변경된 약관은 게시한 시점부터
            효력이 발생합니다.
          </p>
          <p>
            약관에 대한 문의는 <a href="/contact">문의 페이지</a> 또는{" "}
            <a href="mailto:extreme0728@gmail.com">extreme0728@gmail.com</a>으로 보내 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
