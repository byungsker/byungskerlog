import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const authState = vi.hoisted(() => ({ isAdmin: false }));

vi.mock("@/lib/client-auth", () => ({
  useIsAdmin: () => authState.isAdmin,
}));

import { AdSense } from "@/components/seo/Adsense";
import { ConditionalAdsenseScript } from "@/components/seo/ConditionalAdsenseScript";

interface WindowWithAdsbygoogle extends Window {
  adsbygoogle?: unknown[];
}

describe("AdSense 렌더링 경계", () => {
  beforeEach(() => {
    authState.isAdmin = false;
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = "ca-pub-1234567890123456";
    delete (window as WindowWithAdsbygoogle).adsbygoogle;
    document.getElementById("google-adsense-script")?.remove();
  });

  it("빈 슬롯은 렌더링하거나 초기화하지 않는다", async () => {
    const { container } = render(<AdSense adClient="ca-pub-1234567890123456" adSlot=" \n" />);

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect((window as WindowWithAdsbygoogle).adsbygoogle).toBeUndefined());
  });

  it("유효한 값은 정규화하고 광고 큐를 한 번만 초기화한다", async () => {
    const queue: unknown[] = [];
    (window as WindowWithAdsbygoogle).adsbygoogle = queue;
    const { rerender } = render(<AdSense adClient="ca-pub-1234567890123456" adSlot={" 1234567890\n"} />);

    await waitFor(() => expect(document.querySelector("ins.adsbygoogle")).not.toBeNull());
    const ad = document.querySelector("ins.adsbygoogle");
    expect(ad).toHaveAttribute("data-ad-client", "ca-pub-1234567890123456");
    expect(ad).toHaveAttribute("data-ad-slot", "1234567890");
    await waitFor(() => expect(queue).toHaveLength(1));

    rerender(<AdSense adClient="ca-pub-1234567890123456" adSlot={" 1234567890\n"} />);
    expect(queue).toHaveLength(1);
  });

  it("관리자에게는 슬롯과 스크립트를 모두 노출하지 않는다", async () => {
    authState.isAdmin = true;
    const { container } = render(
      <>
        <ConditionalAdsenseScript clientId="ca-pub-1234567890123456" />
        <AdSense adClient="ca-pub-1234567890123456" adSlot="1234567890" />
      </>
    );

    expect(container).toBeEmptyDOMElement();
    await waitFor(() => expect(document.getElementById("google-adsense-script")).toBeNull());
    expect((window as WindowWithAdsbygoogle).adsbygoogle).toBeUndefined();
  });

  it("스크립트는 유효한 client ID로 한 번만 삽입한다", async () => {
    const { unmount } = render(
      <>
        <ConditionalAdsenseScript clientId={" ca-pub-1234567890123456\n"} />
        <ConditionalAdsenseScript clientId="ca-pub-1234567890123456" />
      </>
    );

    await waitFor(() => expect(document.querySelectorAll("#google-adsense-script")).toHaveLength(1));
    expect(screen.queryByRole("script")).not.toBeInTheDocument();
    expect(document.getElementById("google-adsense-script")).toHaveAttribute(
      "src",
      "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1234567890123456"
    );

    unmount();
    expect(document.getElementById("google-adsense-script")).toBeNull();
  });

  it("관리자 판정이 늦게 바뀌어도 이미 삽입된 스크립트를 제거한다", async () => {
    const { rerender } = render(<ConditionalAdsenseScript clientId="ca-pub-1234567890123456" />);
    await waitFor(() => expect(document.getElementById("google-adsense-script")).not.toBeNull());

    authState.isAdmin = true;
    rerender(<ConditionalAdsenseScript clientId="ca-pub-1234567890123456" />);

    await waitFor(() => expect(document.getElementById("google-adsense-script")).toBeNull());
  });
});
