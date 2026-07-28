import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/common/ProductCard";
import { companyProducts } from "@/lib/product-data";

export function HomeProducts() {
  return (
    <section className="home-products mt-16 border-t border-border/60 pt-10" aria-labelledby="home-products-title">
      <div className="home-products-heading mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">병스커랩</p>
          <h2 id="home-products-title" className="mt-2 text-2xl font-bold tracking-tight">
            제가 만들고 사용하는 제품
          </h2>
        </div>
        <Link
          href="/products"
          className="inline-flex min-h-11 min-w-11 w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          모두 보기
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <div className="home-products-grid grid grid-cols-1 gap-5 md:grid-cols-2">
        {companyProducts.slice(0, 2).map((product) => (
          <ProductCard key={product.slug} product={product} compact />
        ))}
      </div>
    </section>
  );
}
