import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileToc } from "@/components/post/MobileToc";

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

describe("모바일 목차", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
    if (originalScrollIntoView) {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
    }
  });

  it("접힌 목차 항목을 포커스 순서에서 제외하고 상태를 전달한다", () => {
    render(<MobileToc content={"## 첫 제목\n\n### 세부 제목"} />);

    const trigger = screen.getByRole("button", { name: "목차 열기" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "첫 제목" })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "목차 닫기" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "첫 제목" })).toBeInTheDocument();
  });

  it("본문 구간을 벗어나면 목차 버튼을 숨긴다", () => {
    const prose = document.createElement("div");
    prose.className = "article-prose";
    prose.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: -1200,
      width: 320,
      height: 800,
      top: -1200,
      right: 320,
      bottom: -400,
      left: 0,
      toJSON: () => ({}),
    }));
    document.body.appendChild(prose);

    render(<MobileToc content={"## 첫 제목"} />);
    fireEvent.scroll(window);

    expect(screen.queryByRole("button", { name: "목차 열기" })).not.toBeInTheDocument();
  });

  it("Escape로 닫고 트리거에 포커스를 돌려준다", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });
    render(<MobileToc content={"## 첫 제목"} />);

    const trigger = screen.getByRole("button", { name: "목차 열기" });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("button", { name: "목차 열기" })).toHaveFocus();
    expect(screen.queryByRole("button", { name: "첫 제목" })).not.toBeInTheDocument();
  });

  it("열린 상태로 본문을 벗어나면 article에 포커스를 옮긴 뒤 목차를 숨긴다", () => {
    const article = document.createElement("article");
    article.tabIndex = -1;
    const prose = document.createElement("div");
    prose.className = "article-prose";
    const rect = vi.fn(() => ({
      x: 0,
      y: 100,
      width: 320,
      height: 1200,
      top: 100,
      right: 320,
      bottom: 1300,
      left: 0,
      toJSON: () => ({}),
    }));
    prose.getBoundingClientRect = rect;
    article.appendChild(prose);
    document.body.appendChild(article);

    render(<MobileToc content={"## 첫 제목"} />);
    fireEvent.click(screen.getByRole("button", { name: "목차 열기" }));
    rect.mockReturnValue({
      x: 0,
      y: -1200,
      width: 320,
      height: 800,
      top: -1200,
      right: 320,
      bottom: -400,
      left: 0,
      toJSON: () => ({}),
    });
    fireEvent.scroll(window);

    expect(article).toHaveFocus();
    expect(screen.queryByRole("button", { name: "목차 열기" })).not.toBeInTheDocument();
  });

  it("열린 뒤 활성 제목이 바뀌어도 사용자의 포커스를 빼앗지 않는다", () => {
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
      writable: true,
    });

    const prose = document.createElement("div");
    prose.className = "article-prose";
    prose.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 320,
      height: 1200,
      top: 0,
      right: 320,
      bottom: 1200,
      left: 0,
      toJSON: () => ({}),
    }));
    const firstHeading = document.createElement("h2");
    firstHeading.id = "first-heading";
    firstHeading.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 50,
      width: 320,
      height: 40,
      top: 50,
      right: 320,
      bottom: 90,
      left: 0,
      toJSON: () => ({}),
    }));
    const secondHeading = document.createElement("h2");
    secondHeading.id = "second-heading";
    const secondRect = vi.fn(() => ({
      x: 0,
      y: 300,
      width: 320,
      height: 40,
      top: 300,
      right: 320,
      bottom: 340,
      left: 0,
      toJSON: () => ({}),
    }));
    secondHeading.getBoundingClientRect = secondRect;
    document.body.append(prose, firstHeading, secondHeading);

    render(<MobileToc content={"## First heading\n\n## Second heading"} />);
    fireEvent.click(screen.getByRole("button", { name: "목차 열기" }));
    const firstButton = screen.getByRole("button", { name: "First heading" });
    expect(firstButton).toHaveFocus();

    secondRect.mockReturnValue({
      x: 0,
      y: 50,
      width: 320,
      height: 40,
      top: 50,
      right: 320,
      bottom: 90,
      left: 0,
      toJSON: () => ({}),
    });
    fireEvent.scroll(window);

    expect(firstButton).toHaveFocus();
  });
});
