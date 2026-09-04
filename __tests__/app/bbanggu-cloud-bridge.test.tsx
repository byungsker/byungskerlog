import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/link", () => ({
  default: (props: { href: string; children?: ReactNode; className?: string }) =>
    createElement("a", { href: props.href, className: props.className }, props.children),
}));

import BbangguCloudBridgePage, { metadata } from "@/app/bbanggu-cloud-bridge/page";
import sitemap from "@/app/sitemap";

describe("Bbanggu Cloud Bridge 공개 페이지", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("canonical metadata가 전용 공개 URL을 가리킨다", () => {
    expect(metadata).toMatchObject({
      title: "Bbanggu Cloud Bridge",
      alternates: {
        canonical: "https://byungskerlog.com/bbanggu-cloud-bridge",
      },
      openGraph: {
        url: "https://byungskerlog.com/bbanggu-cloud-bridge",
      },
    });
  });

  it("관련 정책 문서와 문의 링크를 렌더링한다", () => {
    const { container } = render(<BbangguCloudBridgePage />);
    const hrefs = Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"));

    expect(container.querySelector("h1")?.textContent).toBe("Bbanggu Cloud Bridge");
    expect(hrefs).toContain("/privacy");
    expect(hrefs).toContain("/terms");
    expect(hrefs).toContain("/contact");
    expect(hrefs).toContain("mailto:extreme0728@gmail.com");
  });

  it("sitemap에 전용 공개 URL을 포함한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.series.findMany.mockResolvedValue([]);
    mockPrisma.tag.findMany.mockResolvedValue([]);

    const urls = (await sitemap()).map((entry) => entry.url);

    expect(urls).toContain("https://byungskerlog.com/bbanggu-cloud-bridge");
  });
});
