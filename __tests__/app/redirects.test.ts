import { describe, expect, it } from "vitest";
import nextConfig from "@/next.config";

describe("Next.js 영구 리다이렉트", () => {
  it("확인된 중복 LONG URL을 라우팅 계층에서 대표 URL로 통합한다", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toContainEqual({
      source: `/posts/${encodeURIComponent("웹앱에서-스플래시-스크린-만들기")}`,
      destination: "/posts/web-app-splash-screen",
      permanent: true,
    });
  });
});
