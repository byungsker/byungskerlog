import { describe, expect, it } from "vitest";
import { ProductCard } from "@/components/common/ProductCard";
import { companyProducts } from "@/lib/product-data";
import { render, screen } from "../../test-utils";

describe("ProductCard", () => {
  it("제품 로고 섬네일을 접근 가능한 이름과 함께 렌더링한다", () => {
    render(<ProductCard product={companyProducts[0]} />);

    expect(screen.getByRole("img", { name: companyProducts[0].logo.alt })).toBeInTheDocument();
  });
});
