import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownRenderer } from "@/components/post/MarkdownRenderer";

const lightboxMocks = vi.hoisted(() => ({
  registerImages: vi.fn(),
  openLightbox: vi.fn(),
}));

vi.mock("@/components/post/ImageLightboxContext", () => ({
  useImageLightbox: () => lightboxMocks,
}));

describe("MarkdownRenderer", () => {
  it("강조 문법이 인용문, 다음 문단, 목록 경계를 삼키지 않는다", () => {
    render(
      <MarkdownRenderer
        content={["> **핵심 요약 **", "", "다음 문단입니다.", "", "-**첫 번째 항목**", "- **두 번째 항목**"].join("\n")}
      />
    );

    expect(screen.getByText("핵심 요약").closest("blockquote")).toBeInTheDocument();
    expect(screen.getByText("다음 문단입니다.").tagName).toBe("P");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("첫 번째 항목").tagName).toBe("STRONG");
  });

  it("일반 단일 줄바꿈은 문단을 나누지 않고 명시적 br만 줄바꿈한다", () => {
    const { container, rerender } = render(<MarkdownRenderer content={"첫 줄\n둘째 줄"} />);

    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container.querySelector("br")).not.toBeInTheDocument();

    rerender(<MarkdownRenderer content={"첫 줄<br />둘째 줄"} />);
    expect(container.querySelector("br")).toBeInTheDocument();
  });

  it("본문 H1을 H2로 낮추고 중복 제목에 서로 다른 ID를 준다", () => {
    const { container } = render(<MarkdownRenderer content={"# 같은 제목\n\n## 같은 제목"} />);

    expect(container.querySelector("h1")).not.toBeInTheDocument();
    expect(Array.from(container.querySelectorAll("h2")).map((heading) => heading.id)).toEqual([
      "같은-제목",
      "같은-제목-1",
    ]);
  });

  it("한국어 조사와 붙은 굵은 글씨를 별표 노출 없이 렌더링한다", () => {
    render(<MarkdownRenderer content={"이게 바로 **WebChat(Hub Chat)**이에요."} />);

    expect(screen.getByText("WebChat(Hub Chat)").tagName).toBe("STRONG");
    expect(screen.getByText("이에요.", { exact: false })).toBeInTheDocument();
  });

  it("긴 링크를 임의 지점에서 줄바꿈하고 모바일 목차가 있어도 본문 폭을 줄이지 않는다", () => {
    const content = "[긴 링크](https://example.com/very-long-path-without-natural-breakpoints)";
    const { container } = render(<MarkdownRenderer content={content} />);

    expect(screen.getByRole("link", { name: "긴 링크" })).toHaveClass("[overflow-wrap:anywhere]");
    expect(container.querySelector(".article-prose")?.className).not.toMatch(/\b(?:pr-10|md:pr-12|xl:pr-0)\b/);
  });

  it("저장 HTML에서 실행 가능한 요소와 이벤트 속성을 제거한다", () => {
    const { container } = render(
      <MarkdownRenderer
        content={
          '<script>alert(1)</script><style>body{display:none}</style><iframe src="https://example.com"></iframe><form><button>전송</button></form><img src="https://example.com/image.png" onerror="alert(1)" />'
        }
      />
    );

    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(container.querySelector("style")).not.toBeInTheDocument();
    expect(container.querySelector("iframe")).not.toBeInTheDocument();
    expect(container.querySelector("form")).not.toBeInTheDocument();
    expect(container.querySelector("[onerror]")).not.toBeInTheDocument();
  });
});
