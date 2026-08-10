import { describe, expect, it } from "vitest";
import { LINKEDIN_SHORT_IMPORT_CONTRACT, normalizeLinkedInShortImport } from "@/lib/linkedin-short-import";
import {
  assertDevelopmentDatabaseUrl,
  DEVELOPMENT_DATABASE_HOST,
  LINKEDIN_IMPORT_ENV_FILE,
  resolveLinkedInImportEnv,
} from "@/lib/server/linkedin-import-environment";

describe("LinkedIn SHORT 가져오기 정규화", () => {
  it("소유자 제공 레코드를 최신순으로 정규화하고 불완전한 레코드는 제외한다", () => {
    const records = normalizeLinkedInShortImport([
      { title: "이전 글", content: "내용", publishedAt: "2026-01-01T00:00:00.000Z" },
      {
        title: "최신 글",
        content: "내용",
        publishedAt: "2026-02-01T00:00:00.000Z",
        url: " https://linkedin.com/posts/1 ",
      },
      { title: "", content: "내용", publishedAt: "2026-03-01T00:00:00.000Z" },
      { title: "날짜 오류", content: "내용", publishedAt: "not-a-date" },
      { title: 1, content: "잘못된 타입", publishedAt: "2026-04-01T00:00:00.000Z" },
      null,
    ]);

    expect(records).toHaveLength(2);
    expect(records.map((record) => record.title)).toEqual(["최신 글", "이전 글"]);
    expect(records[0].url).toBe("https://linkedin.com/posts/1");
  });

  it("허용된 LinkedIn 게시글 URL만 보존하고 나머지는 생략한다", () => {
    const records = normalizeLinkedInShortImport([
      {
        title: "게시글 URL",
        content: "내용",
        publishedAt: "2026-02-01T00:00:00.000Z",
        url: "https://www.linkedin.com/feed/update/urn:li:activity:123",
      },
      {
        title: "자격 증명이 포함된 URL",
        content: "내용",
        publishedAt: "2026-01-07T00:00:00.000Z",
        url: "https://user:pass@www.linkedin.com/posts/123",
      },
      {
        title: "기본값이 아닌 포트 URL",
        content: "내용",
        publishedAt: "2026-01-06T12:00:00.000Z",
        url: "https://www.linkedin.com:444/posts/123",
      },
      {
        title: "악성 스킴",
        content: "내용",
        publishedAt: "2026-01-06T00:00:00.000Z",
        url: "javascript:alert(1)",
      },
      {
        title: "다른 호스트",
        content: "내용",
        publishedAt: "2026-01-05T00:00:00.000Z",
        url: "https://linkedin.com.evil.example/posts/123",
      },
      {
        title: "안전하지 않은 스킴",
        content: "내용",
        publishedAt: "2026-01-04T12:00:00.000Z",
        url: "http://linkedin.com/posts/123",
      },
      {
        title: "프로필 URL",
        content: "내용",
        publishedAt: "2026-01-04T00:00:00.000Z",
        url: "https://linkedin.com/in/byungsker",
      },
      {
        title: "상대 URL",
        content: "내용",
        publishedAt: "2026-01-03T00:00:00.000Z",
        url: "/posts/123",
      },
    ]);

    expect(records.map((record) => record.url)).toEqual([
      "https://www.linkedin.com/feed/update/urn:li:activity:123",
      null,
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
});

describe("LinkedIn SHORT 가져오기 계약", () => {
  it("공개 프로필 크롤링 대신 승인된 내보내기 경계를 명시한다", () => {
    expect(LINKEDIN_SHORT_IMPORT_CONTRACT.source).toContain("account-owner export");
    expect(LINKEDIN_SHORT_IMPORT_CONTRACT.prohibited).toContain("unauthorized public-profile crawling");
  });
});

describe("LinkedIn SHORT 실행 경계", () => {
  it("개발 환경 파일과 개발 Neon 브랜치만 허용한다", () => {
    expect(resolveLinkedInImportEnv()).toContain(LINKEDIN_IMPORT_ENV_FILE);
    expect(() => resolveLinkedInImportEnv(".env")).toThrow("development-only");
    expect(() =>
      assertDevelopmentDatabaseUrl(
        "postgresql://ep-old-poetry-a16nvu2i.neon.tech/neondb?branch=ep-wandering-tree-a11ymokd"
      )
    ).toThrow(DEVELOPMENT_DATABASE_HOST);
    expect(() => assertDevelopmentDatabaseUrl(`postgresql://${DEVELOPMENT_DATABASE_HOST}/neondb`)).not.toThrow();
  });
});
