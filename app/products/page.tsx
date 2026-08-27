import { ProductCard } from "@/components/common/ProductCard";
import { Globe, Package, Zap, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Products | Byungsker Log",
  description: "병스커가 개발한 다양한 프로덕트들을 확인해보세요. Web, NPM, SaaS, App 카테고리별 프로젝트를 소개합니다.",
  alternates: {
    canonical: `${siteUrl}/products`,
  },
  openGraph: {
    title: "Products | Byungsker Log",
    description: "병스커가 개발한 다양한 프로덕트들을 확인해보세요.",
    url: `${siteUrl}/products`,
    type: "website",
  },
};

interface Product {
  name: string;
  description: string;
  url: string;
  status?: "released" | "in-progress";
}

interface ProductCategory {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  products: Product[];
}

const productData: ProductCategory[] = [
  {
    category: "Web",
    icon: Globe,
    products: [
      {
        name: "JSON Animation Viewer",
        description: "JSON 애니메이션을 실시간으로 미리보고 편집할 수 있는 웹 뷰어",
        url: "https://json-animation-viewer.vercel.app/",
        status: "released",
      },
    ],
  },
  {
    category: "NPM",
    icon: Package,
    products: [
      {
        name: "Figmable",
        description: "Figma 디자인을 프로그래밍 방식으로 다룰 수 있는 라이브러리",
        url: "https://www.npmjs.com/package/figmable",
        status: "released",
      },
      {
        name: "Bridge-zip",
        description: "브릿지 패턴을 활용한 압축 라이브러리",
        url: "https://www.npmjs.com/package/bridge-zip",
        status: "released",
      },
      {
        name: "markyfy",
        description: "마크다운 처리를 위한 유틸리티 라이브러리",
        url: "https://www.npmjs.com/package/markyfy",
        status: "released",
      },
    ],
  },
  {
    category: "SaaS",
    icon: Zap,
    products: [
      {
        name: "Brand AI",
        description: "AI 기반 브랜딩 솔루션",
        url: "#",
        status: "in-progress",
      },
    ],
  },
  {
    category: "App",
    icon: Smartphone,
    products: [
      {
        name: "Bookgolas (litgoal)",
        description: "독서 목표를 관리하고 추적하는 앱",
        url: "https://apps.apple.com/kr/app/litgoal/id6748870919",
        status: "released",
      },
      {
        name: "꾸깃",
        description: "꾸준한 습관 형성을 돕는 서비스",
        url: "https://ggugitt.com/",
        status: "released",
      },
      {
        name: "오키나와",
        description: "여행 정보 및 가이드 서비스",
        url: "https://www.oknawa.com/",
        status: "released",
      },
    ],
  },
];

export default function ProductsPage() {
  return (
    <div className="products-page-container container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="page-header mb-12">
          <h1 className="text-4xl font-bold mb-4">Products</h1>
          <p className="text-muted-foreground text-lg">
            개발하고 운영하고 있는 다양한 프로덕트들을 소개합니다.
          </p>
        </header>

        <section className="products-section space-y-12">
          {productData.map((categoryData) => {
            const Icon = categoryData.icon;
            return (
              <article key={categoryData.category} className="category-section">
                <div className="category-header flex items-center gap-3 mb-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">{categoryData.category}</h2>
                </div>
                <div className="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryData.products.map((product) => (
                    <ProductCard key={product.name} product={product} />
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
