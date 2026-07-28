import { describe, expect, it } from "vitest";
import {
  createHeadingId,
  extractMarkdownHeadings,
  normalizeMarkdownContent,
  splitMarkdownSegments,
} from "@/lib/markdown-content";

describe("normalizeMarkdownContent", () => {
  it("강조 문법 주변의 문단 경계를 보존한다", () => {
    const content = ["> **핵심 요약 **", "", "다음 문단입니다.", "", "-**첫 번째 항목**", "- **두 번째 항목**"].join(
      "\n"
    );

    expect(normalizeMarkdownContent(content)).toBe(
      ["> **핵심 요약**", "", "다음 문단입니다.", "", "- **첫 번째 항목**", "- **두 번째 항목**"].join("\n")
    );
  });

  it("코드 펜스 내부의 마크다운처럼 보이는 텍스트는 변경하지 않는다", () => {
    const content = ["```md", "# 제목", "-**그대로**", "** 공백 **", "```", "# 본문 제목"].join("\n");

    expect(normalizeMarkdownContent(content)).toBe(
      ["```md", "# 제목", "-**그대로**", "** 공백 **", "```", "## 본문 제목"].join("\n")
    );
  });

  it("정보 문자열이 붙은 같은 문자 펜스를 닫는 펜스로 오인하지 않는다", () => {
    const content = ["```md", "```js", "# 코드 속 제목", "```", "## 실제 제목"].join("\n");

    expect(normalizeMarkdownContent(content)).toBe(content);
    expect(extractMarkdownHeadings(content)).toEqual([{ id: "실제-제목", text: "실제 제목", level: 2 }]);
  });

  it("네 칸 들여쓴 H1 모양의 코드를 변경하지 않는다", () => {
    expect(normalizeMarkdownContent("    # indented code")).toBe("    # indented code");
  });

  it("본문 H1과 HTML H1을 H2로 낮추고 HTML H2/H3은 계층을 보존한다", () => {
    const content = ["# 첫 제목", "<h1>둘째 제목</h1>", "<h2>셋째 제목</h2>", "<h3>넷째 제목</h3>"].join("\n");

    expect(normalizeMarkdownContent(content)).toBe(
      ["## 첫 제목", "## 둘째 제목", "## 셋째 제목", "### 넷째 제목"].join("\n")
    );
  });

  it("Windows 줄바꿈만 표준 줄바꿈으로 정규화한다", () => {
    expect(normalizeMarkdownContent("첫 문단\r\n\r\n둘째 문단")).toBe("첫 문단\n\n둘째 문단");
  });

  it("한국어 조사와 붙은 일반 텍스트 굵은 글씨를 안전한 인라인 HTML로 변환한다", () => {
    expect(normalizeMarkdownContent("이게 바로 **WebChat(Hub Chat)**이에요.")).toBe(
      "이게 바로 <strong>WebChat(Hub Chat)</strong>이에요."
    );
    expect(normalizeMarkdownContent("일반 **굵은 글씨** 문장")).toBe("일반 **굵은 글씨** 문장");
  });

  it("한 줄의 여러 굵은 글씨를 서로 다른 쌍으로 처리하고 인라인 코드는 보존한다", () => {
    const content = '앞<strong>힌트</strong> **용기 ** 뒤와 **마지막 강조** 문장 `const marker = "**";`';

    expect(normalizeMarkdownContent(content)).toBe(
      '앞<strong>힌트</strong> **용기** 뒤와 **마지막 강조** 문장 `const marker = "**";`'
    );
  });
});

describe("heading helpers", () => {
  it("빈 제목에도 안정적인 ID를 만든다", () => {
    expect(createHeadingId("안녕하세요, World!")).toBe("안녕하세요-world");
    expect(createHeadingId("🎉")).toBe("section");
  });

  it("코드 펜스는 제외하고 중복 제목 ID와 H2 이상 계층을 만든다", () => {
    const content = ["# 시작", "## 같은 제목", "## 같은 제목", "```md", "# 코드 속 제목", "```", "### 세부"].join("\n");

    expect(extractMarkdownHeadings(content)).toEqual([
      { id: "시작", text: "시작", level: 2 },
      { id: "같은-제목", text: "같은 제목", level: 2 },
      { id: "같은-제목-1", text: "같은 제목", level: 2 },
      { id: "세부", text: "세부", level: 3 },
    ]);
  });

  it("렌더러와 동일하게 들여쓴 코드는 제외하고 Setext와 HTML 엔티티 제목을 해석한다", () => {
    const content = ["    ## 코드 제목", "R&D &amp; QA", "==============", "## R&D &amp; QA"].join("\n");

    expect(extractMarkdownHeadings(content)).toEqual([
      { id: "rd-qa", text: "R&D & QA", level: 2 },
      { id: "rd-qa-1", text: "R&D & QA", level: 2 },
    ]);
  });

  it("표준 named entity와 잘못된 숫자 entity를 렌더러와 동일하게 안전하게 해석한다", () => {
    const content = ["## Copyright &copy; 2026", "## Invalid &#x110000;"].join("\n");

    expect(extractMarkdownHeadings(content)).toEqual([
      { id: "copyright-2026", text: "Copyright © 2026", level: 2 },
      { id: "invalid", text: "Invalid �", level: 2 },
    ]);
  });
});

describe("splitMarkdownSegments", () => {
  it("단독 URL만 링크 카드로 분리하고 코드 블록 URL은 보존한다", () => {
    const content = ["앞 문단", "", "https://example.com", "", "```", "https://inside.example", "```"].join("\n");

    expect(splitMarkdownSegments(content)).toEqual([
      { type: "markdown", content: "앞 문단\n" },
      { type: "url", content: "https://example.com" },
      { type: "markdown", content: "\n```\nhttps://inside.example\n```" },
    ]);
  });

  it("들여쓴 코드와 raw pre 블록 안의 URL은 링크 카드로 분리하지 않는다", () => {
    const content = ["    https://indented.example", "<pre>", "https://inside.example", "</pre>"].join("\n");

    expect(splitMarkdownSegments(content)).toEqual([{ type: "markdown", content }]);
  });
});
