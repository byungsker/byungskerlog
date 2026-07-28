import { describe, expect, it } from "vitest";
import { companyProducts, getProductBySlug, legacyProjects } from "@/lib/product-data";

describe("제품 데이터", () => {
  it("공개 승인된 병스커랩 제품만 제공한다", () => {
    expect(companyProducts.map((product) => product.slug)).toEqual(["bookgolas", "baroguni"]);
    expect(JSON.stringify(companyProducts)).not.toMatch(/OpenCSMap|trading-agent-office/i);
  });

  it("각 제품에 크롤러가 사용할 수 있는 래스터 OG 이미지를 제공한다", () => {
    for (const product of companyProducts) {
      expect(product.ogImage.src).toMatch(/\.(png|jpe?g|webp)$/i);
      expect(product.ogImage.width).toBeGreaterThanOrEqual(200);
      expect(product.ogImage.height).toBeGreaterThanOrEqual(200);
    }
  });

  it("각 제품에 내부 이야기 링크를 만들 수 있는 slug와 검증된 외부 링크가 있다", () => {
    for (const product of companyProducts) {
      expect(getProductBySlug(product.slug)).toBe(product);
      expect(product.officialLinks.length).toBeGreaterThan(0);

      for (const link of product.officialLinks) {
        expect(() => new URL(link.href)).not.toThrow();
        expect(link.href.startsWith("https://")).toBe(true);
      }
    }
  });

  it("근거 없는 작업중 상태나 빈 목적지를 노출하지 않는다", () => {
    const publicCopy = JSON.stringify({ companyProducts, legacyProjects });

    expect(publicCopy).not.toMatch(/작업중|곧 출시|href":"#"/);
  });

  it("Bookgolas의 현재 App Store 앱 ID를 고정한다", () => {
    const bookgolas = getProductBySlug("bookgolas");
    const appStoreLink = bookgolas?.officialLinks.find((link) => link.label === "App Store");

    expect(appStoreLink?.href).toBe(
      "https://apps.apple.com/kr/app/bookgolas-ai-%EB%8F%85%EC%84%9C-%EA%B4%80%EB%A6%AC/id6757021809"
    );
    expect(JSON.stringify(bookgolas)).not.toMatch(/Litgoal|6748870919|com\.litgoal\.app/i);
  });
});
