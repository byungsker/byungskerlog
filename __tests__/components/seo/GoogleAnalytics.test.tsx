import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/posts/example",
}));

vi.mock("next/script", () => ({
  default: ({ children, id, src }: { children?: ReactNode; id?: string; src?: string }) =>
    createElement("script", { "data-script-id": id, src }, children),
}));

describe("GoogleAnalytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("유효한 측정 ID가 있으면 GA4 script와 page-view 설정을 렌더링한다", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-Q3KCH6Q8LZ");
    const { GoogleAnalytics } = await import("@/components/seo/GoogleAnalytics");

    const { container } = render(<GoogleAnalytics />);

    expect(container.querySelector('script[src="https://www.googletagmanager.com/gtag/js?id=G-Q3KCH6Q8LZ"]')).not.toBeNull();
    expect(container.querySelector('[data-script-id="google-analytics"]')?.textContent).toContain(
      "G-Q3KCH6Q8LZ"
    );
  });

  it("측정 ID가 없으면 외부 analytics script를 렌더링하지 않는다", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    const { GoogleAnalytics } = await import("@/components/seo/GoogleAnalytics");

    const { container } = render(<GoogleAnalytics />);

    expect(container.querySelectorAll("script")).toHaveLength(0);
  });
});
