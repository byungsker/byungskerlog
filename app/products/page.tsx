import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { ProductCard } from "@/components/common/ProductCard";
import { Card, CardDescription, CardHeader } from "@/components/ui/Card";
import { companyProducts, legacyProjects } from "@/lib/product-data";
import { siteConfig } from "@/lib/site-config";

const siteUrl = siteConfig.url;

export const metadata: Metadata = {
  title: "만든 제품",
  description: "제가 반복해서 겪은 문제를 직접 해결하기 위해 만들고, 먼저 계속 사용하며 다듬는 제품을 소개합니다.",
  alternates: {
    canonical: `${siteUrl}/products`,
  },
  openGraph: {
    title: "만든 제품 | Byungsker Log",
    description: "제가 반복해서 겪은 문제를 직접 해결하기 위해 만들고, 먼저 계속 사용하며 다듬는 제품을 소개합니다.",
    url: `${siteUrl}/products`,
    type: "website",
  },
};

export default function ProductsPage() {
  return (
    <div className="products-page-container container mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="page-header max-w-3xl">
          <p className="text-sm font-medium text-primary">병스커랩</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">만든 제품</h1>
          <p className="mt-6 text-lg leading-8 text-foreground/80">
            제가 반복해서 겪은 문제를 직접 해결하기 위해 만든 제품들입니다. 먼저 제가 계속 사용하고, 다른 사람에게도
            유용한지 확인하며 다듬습니다.
          </p>
        </header>

        <section className="byungskerlab-products mt-14" aria-labelledby="byungskerlab-products-title">
          <div className="section-heading mb-6">
            <h2 id="byungskerlab-products-title" className="text-2xl font-bold">
              지금 공개한 제품
            </h2>
            <p className="mt-2 text-muted-foreground">
              직접 쓰며 운영하고 있는 두 제품의 문제와 제작 배경을 소개합니다.
            </p>
          </div>
          <div className="products-grid grid grid-cols-1 gap-6 md:grid-cols-2">
            {companyProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>

        <section
          className="legacy-projects mt-20 border-t border-border/60 pt-10"
          aria-labelledby="legacy-projects-title"
        >
          <div className="section-heading mb-6 max-w-2xl">
            <h2 id="legacy-projects-title" className="text-2xl font-bold">
              이전 프로젝트
            </h2>
            <p className="mt-2 text-muted-foreground">
              병스커랩 제품과는 별도로, 이전에 공개한 개인 프로젝트와 패키지입니다.
            </p>
          </div>
          <div className="legacy-project-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {legacyProjects.map((project) => (
              <Card key={project.name} className="legacy-project-card h-full border-border/50 bg-card/40 py-0">
                <CardHeader className="py-5">
                  <span className="text-xs font-medium text-muted-foreground">{project.category}</span>
                  <h3 className="text-lg font-semibold leading-none">
                    <a
                      href={project.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {project.name}
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="sr-only">(새 창)</span>
                    </a>
                  </h3>
                  <CardDescription className="leading-6">{project.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
