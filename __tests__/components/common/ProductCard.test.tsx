import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/common/ProductCard";
import { companyProducts } from "@/lib/product-data";
import { render, screen } from "../../test-utils";

describe("제품 카드", () => {
  it("제품 로고 섬네일을 접근 가능한 이름과 함께 렌더링한다", () => {
    render(<ProductCard product={companyProducts[0]} />);

    expect(screen.getByRole("img", { name: companyProducts[0].logo.alt })).toBeInTheDocument();
  });

  it("제품 상세 링크와 외부 공식 링크를 안전하게 렌더링한다", () => {
    const product = companyProducts[0];
    render(<ProductCard product={product} />);

    expect(screen.getByRole("link", { name: /제품 이야기/ })).toHaveAttribute(
      "href",
      `/products/${product.slug}`
    );

    const externalLink = screen.getByRole("link", {
      name: new RegExp(product.officialLinks[0].label),
    });
    expect(externalLink).toHaveAttribute("href", product.officialLinks[0].href);
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
