import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "이용약관 | Byungsker Log",
  description: "Byungsker Log의 이용약관입니다. 사이트 이용 조건, 지적재산권, 면책 조항 등을 안내합니다.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    title: "이용약관 | Byungsker Log",
    description: "Byungsker Log의 이용약관입니다.",
    url: `${siteUrl}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">이용약관</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
          <p className="text-muted-foreground mb-8">최종 수정일: 2026년 3월 13일</p>

          <p>
            본 이용약관은 Byungsker Log(이하 &ldquo;본 사이트&rdquo;)의 이용 조건을 규정합니다. 본 사이트를 방문하거나
            이용하시는 경우 본 약관에 동의하는 것으로 간주됩니다.
          </p>

          <h2>1. 서비스 개요</h2>
          <p>
            본 사이트는 소프트웨어 개발, 제품 개발, 스타트업 등에 관한 기술 블로그로, 글, 튜토리얼, 프로젝트 소개 등의
            콘텐츠를 제공합니다. 모든 콘텐츠는 정보 제공 목적으로 작성됩니다.
          </p>

          <h2>2. 지적재산권</h2>
          <p>
            본 사이트에 게시된 모든 콘텐츠(텍스트, 이미지, 코드 등)는 별도의 라이선스 표기가 없는 한 운영자에게 저작권이
            있습니다.
          </p>
          <ul>
            <li>
              <strong>개인적 용도:</strong> 본 사이트의 콘텐츠를 학습, 연구 등 개인적 목적으로 자유롭게 이용하실 수
              있습니다.
            </li>
            <li>
              <strong>비상업적 공유:</strong> 출처를 명시하는 경우 비상업적 목적의 공유가 가능합니다.
            </li>
            <li>
              <strong>상업적 이용:</strong> 상업적 목적으로의 복제, 배포, 수정은 사전 서면 동의가 필요합니다.
            </li>
            <li>
              <strong>코드 예시:</strong> 블로그에 포함된 코드 스니펫은 별도 표기가 없는 한 MIT 라이선스로 자유롭게
              사용하실 수 있습니다.
            </li>
          </ul>

          <h2>3. 면책 조항</h2>
          <p>본 사이트의 콘텐츠는 정보 제공 목적으로 작성되며, 정확성이나 완전성을 보장하지 않습니다.</p>
          <ul>
            <li>본 사이트의 정보를 기반으로 내린 결정이나 행동에 대해 운영자는 책임을 지지 않습니다.</li>
            <li>기술 관련 콘텐츠는 작성 시점을 기준으로 하며, 시간이 지남에 따라 최신 정보와 다를 수 있습니다.</li>
            <li>
              외부 링크는 참고 목적으로 제공되며, 외부 사이트의 내용이나 서비스에 대해 운영자는 책임을 지지 않습니다.
            </li>
          </ul>

          <h2>4. 댓글 및 사용자 콘텐츠</h2>
          <p>본 사이트에서 댓글 등 사용자 콘텐츠를 작성하시는 경우 다음 사항을 준수해 주세요.</p>
          <ul>
            <li>타인을 비방하거나 모욕하는 내용 금지</li>
            <li>스팸, 광고 목적의 댓글 금지</li>
            <li>타인의 저작권을 침해하는 내용 금지</li>
            <li>불법적이거나 유해한 내용 금지</li>
          </ul>
          <p>위 사항을 위반하는 댓글은 사전 통보 없이 삭제될 수 있습니다.</p>

          <h2>5. 광고</h2>
          <p>
            본 사이트는 Google AdSense를 통해 광고를 게재할 수 있습니다. 광고 내용은 운영자가 직접 통제하지 않으며,
            광고에 의한 문제에 대해 운영자는 책임을 지지 않습니다.
          </p>

          <h2>6. 서비스 변경 및 중단</h2>
          <p>
            운영자는 사전 통보 없이 사이트의 콘텐츠를 수정, 삭제하거나 서비스를 일시적 또는 영구적으로 중단할 수
            있습니다.
          </p>

          <h2>7. 약관 변경</h2>
          <p>
            본 이용약관은 필요에 따라 변경될 수 있으며, 변경 시 본 페이지를 통해 공지합니다. 변경된 약관은 게시 즉시
            효력이 발생합니다.
          </p>

          <h2>8. 문의</h2>
          <p>
            본 이용약관에 대한 문의사항이 있으시면 <a href="/contact">문의 페이지</a>를 통해 연락해 주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
