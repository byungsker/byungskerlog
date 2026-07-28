import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { companyProducts, getProductBySlug } from "@/lib/product-data";
import { siteConfig } from "@/lib/site-config";

const siteUrl = siteConfig.url;

interface ProductDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return companyProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return {};
  }

  const canonical = `${siteUrl}/products/${product.slug}`;

  return {
    title: `${product.name} (${product.localizedName})`,
    description: product.description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${product.name} (${product.localizedName}) | Byungsker Log`,
      description: product.description,
      url: canonical,
      type: "website",
      images: [
        {
          url: `${siteUrl}${product.logo.src}`,
          width: product.logo.width,
          height: product.logo.height,
          alt: product.logo.alt,
        },
      ],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const canonical = `${siteUrl}/products/${product.slug}`;
  const downloadLink = product.officialLinks.find((link) => link.label === "App Store");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    alternateName: product.localizedName,
    description: product.description,
    url: canonical,
    applicationCategory: product.applicationCategory,
    operatingSystem: product.operatingSystem,
    ...(downloadLink ? { downloadUrl: downloadLink.href } : {}),
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "KRW",
    },
  };

  return (
    <article className="product-detail-page container mx-auto px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-5xl">
        <Link
          href="/products"
          className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          만든 제품으로 돌아가기
        </Link>

        <header className="product-hero mt-10 grid gap-10 border-b border-border/60 pb-14 lg:grid-cols-[1fr_18rem] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-primary">{product.localizedName}</span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {product.publicStatus}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">{product.name}</h1>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-foreground/85">{product.problem}</p>
            <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{product.origin}</p>
            <div className="official-links mt-8 flex flex-wrap gap-3">
              {product.officialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {link.label}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(새 창)</span>
                </a>
              ))}
            </div>
            {product.officialLinks.some((link) => link.storefrontNote) && (
              <p className="mt-3 text-sm text-muted-foreground">
                {product.officialLinks.find((link) => link.storefrontNote)?.storefrontNote}
              </p>
            )}
          </div>
          <div className="product-logo mx-auto flex aspect-square w-full max-w-64 items-center justify-center overflow-hidden rounded-3xl border border-border/60 bg-muted/30 p-7">
            <Image
              src={product.logo.src}
              alt={product.logo.alt}
              width={product.logo.width}
              height={product.logo.height}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </header>

        <div className="product-story mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-12">
            <StorySection number="01" title="반복해서 겪은 문제">
              {product.problem}
            </StorySection>
            <StorySection number="02" title="기존에 개인적으로 해결하던 방식">
              {product.previousApproach}
            </StorySection>
            <StorySection number="03" title="제품으로 만든 이유">
              {product.productReason}
            </StorySection>
            <StorySection number="04" title="실제 사용 방식">
              {product.actualUse}
            </StorySection>
          </div>
          <aside className="product-summary h-fit rounded-2xl border border-border/60 bg-muted/30 p-6 lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-primary">한 문장으로</p>
            <p className="mt-3 leading-7 text-foreground/85">{product.description}</p>
          </aside>
        </div>

        <section className="product-features mt-20 border-t border-border/60 pt-14" aria-labelledby="features-title">
          <p className="text-sm font-semibold text-primary">05</p>
          <h2 id="features-title" className="mt-2 text-3xl font-bold tracking-tight">
            핵심 기능과 실제 화면
          </h2>
          <div className="feature-list mt-8 grid gap-4 md:grid-cols-3">
            {product.features.map((feature) => (
              <article key={feature.title} className="rounded-xl border border-border/60 bg-card/50 p-5">
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
              </article>
            ))}
          </div>
          <div
            className={`product-gallery mt-10 grid gap-6 ${
              product.images.length > 1 ? "sm:grid-cols-2" : "sm:grid-cols-1"
            }`}
          >
            {product.images.map((image) => (
              <figure
                key={image.src}
                className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-6"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  className="mx-auto h-auto max-h-[42rem] w-auto rounded-xl"
                  sizes="(max-width: 640px) 88vw, 420px"
                />
                <figcaption className="mt-4 text-sm leading-6 text-muted-foreground">{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          className="official-destinations mt-20 border-t border-border/60 pt-14"
          aria-labelledby="destinations-title"
        >
          <p className="text-sm font-semibold text-primary">06</p>
          <h2 id="destinations-title" className="mt-2 text-3xl font-bold tracking-tight">
            공식 목적지
          </h2>
          <ul className="mt-6 space-y-3">
            {product.officialLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {link.label}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">(새 창)</span>
                </a>
                {link.storefrontNote && <p className="mt-1 text-sm text-muted-foreground">{link.storefrontNote}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="related-posts mt-20 border-t border-border/60 pt-14" aria-labelledby="related-posts-title">
          <p className="text-sm font-semibold text-primary">07</p>
          <h2 id="related-posts-title" className="mt-2 text-3xl font-bold tracking-tight">
            관련 글
          </h2>
          {product.relatedPosts.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {product.relatedPosts.map((post) => (
                <li key={post.href}>
                  <Link
                    href={post.href}
                    className="inline-flex min-h-11 min-w-11 items-center rounded-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border bg-muted/20 p-5 leading-7 text-muted-foreground">
              아직 이 제품을 다룬 글은 공개하지 않았습니다. 실제 제작 기록이 공개되면 이곳에 연결하겠습니다.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}

interface StorySectionProps {
  number: string;
  title: string;
  children: React.ReactNode;
}

function StorySection({ number, title, children }: StorySectionProps) {
  return (
    <section aria-labelledby={`story-${number}`}>
      <p className="text-sm font-semibold text-primary">{number}</p>
      <h2 id={`story-${number}`} className="mt-2 text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-4 text-lg leading-8 text-foreground/80">{children}</p>
    </section>
  );
}
