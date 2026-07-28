import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StructuredData } from "@/components/seo/StructuredData";
import { siteConfig } from "@/lib/site-config";

describe("StructuredData", () => {
  it("전역 구조화 데이터에 권위 도메인만 사용한다", () => {
    const markup = renderToStaticMarkup(<StructuredData type="blog" />);
    const json = markup.match(/<script[^>]*>(.*)<\/script>/)?.[1];

    expect(json).toBeDefined();

    const structuredData = JSON.parse(json ?? "{}");
    const serialized = JSON.stringify(structuredData);

    expect(serialized).toContain(siteConfig.url);
    expect(serialized).not.toContain("https://byungskerlog.vercel.app");
  });

  it("사용자 제공 데이터가 script 태그를 종료하지 못하도록 이스케이프한다", () => {
    const markup = renderToStaticMarkup(
      <StructuredData
        type="article"
        data={{
          slug: "unsafe",
          title: "</script><script>alert('xss')</script>",
          description: "검증",
        }}
      />
    );
    const json = markup.match(/<script[^>]*>(.*)<\/script>/)?.[1];

    expect(markup).not.toContain("</script><script>");
    expect(json).toContain("\\u003c/script>");
    expect(JSON.parse(json ?? "{}")["@graph"][3].headline).toContain("</script>");
  });
});
