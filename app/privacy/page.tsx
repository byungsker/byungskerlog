import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Bbanggu Cloud Bridge",
  description:
    "Byungsker Log와 Bbanggu Cloud Bridge가 개인정보와 Google 사용자 데이터를 처리하는 방법을 안내합니다.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    title: "개인정보처리방침 | Bbanggu Cloud Bridge",
    description: "Byungsker Log와 Bbanggu Cloud Bridge의 개인정보처리방침입니다.",
    url: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-4xl font-bold">개인정보처리방침</h1>
        <div className="prose prose-lg max-w-none dark:prose-invert prose-p:leading-relaxed prose-li:leading-relaxed">
          <p className="mb-8 text-muted-foreground">최종 수정일: 2026년 9월 4일</p>

          <p>
            Byungsker Log(이하 &ldquo;본 사이트&rdquo;)와 Bbanggu Cloud Bridge(이하 &ldquo;본 애플리케이션&rdquo;)는 이용자의
            개인정보와 Google 사용자 데이터를 중요하게 생각합니다. 이 방침은 본 사이트와 본 애플리케이션이
            어떤 정보를 처리하고, 어떤 목적으로 사용하며, 어떻게 보관하고 보호하는지 설명합니다.
          </p>

          <h2>1. Bbanggu Cloud Bridge의 Google API 연동</h2>
          <p>
            본 애플리케이션은 사용자가 OAuth 동의 화면에서 승인한 Google 계정에 연결됩니다. Google API 접근은
            사용자가 요청한 작업을 수행하는 데 필요한 범위에서만 이루어집니다.
          </p>
          <ul>
            <li>
              <strong>Google Calendar:</strong> 사용자의 요청에 따른 일정 조회와 일정 관리
            </li>
            <li>
              <strong>Gmail:</strong> 메시지 검색, 읽기, 전송과 사용자가 요청한 메시지 수정
            </li>
            <li>
              <strong>Google Drive:</strong> 파일 검색, 읽기, 업로드, 생성과 사용자가 요청한 파일 수정
            </li>
          </ul>
          <p>
            Google 사용자 데이터는 광고, 판매, 신용평가, 개인화 광고 또는 이용자와 무관한 목적으로 사용하지
            않습니다. 본 애플리케이션은 사용자의 Google 비밀번호를 요구하거나 저장하지 않습니다.
          </p>

          <h2>2. 데이터 처리와 보관</h2>
          <p>
            본 애플리케이션은 소유자의 로컬 환경에서 Google API를 호출합니다. OAuth 자격 증명은 소유자의 로컬
            Hermes 프로필에 보관되며, 본 사이트의 웹 서버에 저장하지 않습니다.
          </p>
          <ul>
            <li>Google API 응답은 요청된 작업을 수행하는 데 필요한 범위에서만 처리합니다.</li>
            <li>본 사이트의 서버에 Gmail 본문, Calendar 일정, Drive 파일 내용을 별도로 저장하지 않습니다.</li>
            <li>본 애플리케이션이 사용자의 요청에 따라 Drive에 만든 파일은 사용자의 Google Drive에 남습니다.</li>
            <li>사용자는 Google 계정 보안 설정에서 접근 권한을 철회할 수 있습니다.</li>
          </ul>
          <p>
            OAuth 권한을 철회하거나 로컬 자격 증명을 삭제하면 본 애플리케이션은 Google API에 접근할 수 없습니다.
          </p>

          <h2>3. 본 사이트가 수집하는 정보</h2>
          <p>본 사이트는 다음과 같은 최소한의 정보를 수집할 수 있습니다.</p>
          <ul>
            <li>
              <strong>자동 수집 정보:</strong> 방문 시 IP 주소, 브라우저 유형, 운영체제, 방문 페이지, 방문 시간이
              수집될 수 있습니다.
            </li>
            <li>
              <strong>댓글 작성 시:</strong> 댓글 서비스 제공에 필요한 이메일 주소, 닉네임 등이 수집될 수 있습니다.
            </li>
            <li>
              <strong>문의 시:</strong> 문의를 처리하기 위해 이용자가 직접 제공한 이메일 주소와 문의 내용이 사용됩니다.
            </li>
          </ul>

          <h2>4. 개인정보 이용 목적</h2>
          <p>수집한 정보는 다음 목적으로 이용됩니다.</p>
          <ul>
            <li>사이트 운영과 서비스 개선</li>
            <li>방문자 통계 분석</li>
            <li>광고 제공과 광고 성과 측정</li>
            <li>댓글과 문의 응대</li>
            <li>본 애플리케이션의 OAuth 연동과 사용자가 요청한 Google API 작업 수행</li>
          </ul>

          <h2>5. 쿠키와 광고</h2>
          <h3>Google AdSense</h3>
          <p>
            본 사이트는 Google AdSense를 사용하여 광고를 게재할 수 있습니다. AdSense는 광고 제공과 측정을 위해
            쿠키를 사용할 수 있습니다. 자세한 내용은{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
              Google 광고 정책
            </a>
            에서 확인할 수 있습니다.
          </p>
          <h3>Google Analytics</h3>
          <p>
            본 사이트는 Google Analytics를 사용하여 방문자 통계를 분석할 수 있습니다. 자세한 내용은 Google의{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              개인정보처리방침
            </a>
            을 확인해 주세요.
          </p>
          <h3>쿠키 비활성화</h3>
          <p>
            이용자는 브라우저 설정을 통해 쿠키를 비활성화할 수 있습니다. Google의 맞춤 광고를 비활성화하려면{" "}
            <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
              Google 광고 설정
            </a>
            을 이용할 수 있습니다.
          </p>

          <h2>6. 개인정보 보관 기간</h2>
          <p>
            본 사이트가 수집한 개인정보는 수집 목적이 달성된 후 지체 없이 파기합니다. 다만 관련 법령에 따라
            보관이 필요한 경우에는 해당 기간 동안 보관합니다.
          </p>
          <p>
            본 애플리케이션의 로컬 OAuth 자격 증명은 사용자가 삭제하거나 접근 권한을 철회할 때까지 로컬 환경에
            남을 수 있습니다. Google API에서 처리된 데이터는 본 사이트의 서버에 별도로 보관하지 않습니다.
          </p>

          <h2>7. 개인정보의 제3자 제공</h2>
          <p>
            본 사이트와 본 애플리케이션은 이용자의 개인정보를 판매하거나 제3자에게 제공하지 않습니다. 다만
            이용자가 요청한 서비스를 제공하기 위해 Google API, Google Analytics, Google AdSense, 댓글 서비스와
            같은 외부 서비스가 각자의 정책에 따라 데이터를 처리할 수 있습니다. 법령에 따른 요청이나 이용자의
            사전 동의가 있는 경우에는 예외로 합니다.
          </p>

          <h2>8. 이용자의 권리와 접근 철회</h2>
          <p>이용자는 개인정보 열람, 정정, 삭제, 처리 정지와 동의 철회를 요청할 수 있습니다.</p>
          <p>
            Google 계정의 애플리케이션 접근 권한은{" "}
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer">
              Google 계정의 서드 파티 앱 접근 관리
            </a>
            에서 직접 철회할 수 있습니다. 그 밖의 요청은 <a href="/contact">문의 페이지</a>를 이용해 주세요.
          </p>

          <h2>9. 개인정보 보호책임자</h2>
          <ul>
            <li>
              <strong>담당자:</strong> 병스커 (Byungsker)
            </li>
            <li>
              <strong>문의:</strong> <a href="mailto:extreme0728@gmail.com">extreme0728@gmail.com</a>
            </li>
          </ul>

          <h2>10. 개인정보처리방침 변경</h2>
          <p>
            본 방침은 법령 변경, 사이트 변경 또는 애플리케이션 기능 변경에 따라 수정될 수 있습니다. 변경된
            내용은 본 페이지에 게시합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
