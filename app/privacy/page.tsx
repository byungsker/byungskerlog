import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Byungsker Log",
  description: "Byungsker Log의 개인정보처리방침입니다. 수집하는 개인정보 항목, 이용 목적, 보관 기간 등을 안내합니다.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    title: "개인정보처리방침 | Byungsker Log",
    description: "Byungsker Log의 개인정보처리방침입니다.",
    url: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">개인정보처리방침</h1>
        <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
          <p className="text-muted-foreground mb-8">최종 수정일: 2026년 3월 13일</p>

          <p>
            Byungsker Log(이하 &ldquo;본 사이트&rdquo;)는 이용자의 개인정보를 중요하게 생각하며, 관련 법령에 따라
            개인정보를 보호하고 있습니다. 본 개인정보처리방침은 본 사이트가 수집하는 정보의 종류, 이용 목적, 보관 기간
            등을 설명합니다.
          </p>

          <h2>1. 수집하는 개인정보 항목</h2>
          <p>본 사이트는 다음과 같은 최소한의 정보를 수집할 수 있습니다.</p>
          <ul>
            <li>
              <strong>자동 수집 정보:</strong> 방문 시 IP 주소, 브라우저 유형, 운영체제, 방문 페이지, 방문 시간 등이
              자동으로 수집됩니다.
            </li>
            <li>
              <strong>댓글 작성 시:</strong> 이메일 주소, 닉네임 등 댓글 서비스 제공에 필요한 정보가 수집될 수 있습니다.
            </li>
          </ul>

          <h2>2. 개인정보 이용 목적</h2>
          <p>수집한 정보는 다음 목적으로 이용됩니다.</p>
          <ul>
            <li>사이트 운영 및 서비스 개선</li>
            <li>방문자 통계 분석 (Google Analytics)</li>
            <li>맞춤형 광고 제공 (Google AdSense)</li>
            <li>댓글 서비스 제공</li>
          </ul>

          <h2>3. 쿠키 및 광고</h2>
          <h3>Google AdSense</h3>
          <p>
            본 사이트는 Google AdSense를 사용하여 광고를 게재합니다. Google AdSense는 사용자의 관심사에 기반한 광고를
            표시하기 위해 쿠키를 사용합니다. Google의 광고 쿠키 사용에 대한 자세한 내용은{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              Google 광고 정책
            </a>
            에서 확인하실 수 있습니다.
          </p>
          <h3>Google Analytics</h3>
          <p>
            본 사이트는 Google Analytics를 사용하여 방문자 통계를 수집합니다. Google Analytics는 쿠키를 사용하여 사이트
            이용 현황을 분석합니다. 수집된 정보는 익명으로 처리되며, Google의{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              개인정보처리방침
            </a>
            에 따라 관리됩니다.
          </p>
          <h3>쿠키 비활성화</h3>
          <p>
            사용자는 브라우저 설정을 통해 쿠키를 비활성화할 수 있습니다. 다만, 쿠키를 비활성화하면 일부 서비스 이용에
            제한이 있을 수 있습니다. Google의 맞춤 광고를 비활성화하려면{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              Google 광고 설정
            </a>
            을 방문하세요.
          </p>

          <h2>4. 개인정보 보관 기간</h2>
          <p>
            수집된 개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다. 다만, 관련 법령에 따라 보관이 필요한 경우 해당
            기간 동안 보관합니다.
          </p>

          <h2>5. 개인정보의 제3자 제공</h2>
          <p>
            본 사이트는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
          </p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령에 의해 요구되는 경우</li>
            <li>
              서비스 제공을 위해 필요한 경우 (Google AdSense, Google Analytics 등 제3자 서비스 제공자에게 익명화된
              데이터 전달)
            </li>
          </ul>

          <h2>6. 이용자의 권리</h2>
          <p>이용자는 다음 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람, 정정, 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>동의 철회</li>
          </ul>
          <p>
            위 권리를 행사하시려면 <a href="/contact">문의 페이지</a>를 통해 연락해 주세요.
          </p>

          <h2>7. 개인정보 보호책임자</h2>
          <ul>
            <li>
              <strong>담당자:</strong> 병스커 (Byungsker)
            </li>
            <li>
              <strong>문의:</strong> <a href="/contact">문의 페이지</a>를 통해 연락해 주세요.
            </li>
          </ul>

          <h2>8. 개인정보처리방침 변경</h2>
          <p>
            본 개인정보처리방침은 법령 변경 또는 서비스 변경에 따라 수정될 수 있습니다. 변경 시 본 페이지를 통해
            공지합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
