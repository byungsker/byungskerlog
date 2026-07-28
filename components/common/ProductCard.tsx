import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/Card";
import type { Product } from "@/lib/product-data";

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

const focusClasses =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const primaryLink = product.officialLinks[0];

  return (
    <Card className="product-card h-full border-border/60 bg-card/60 transition-colors hover:border-primary/40">
      <CardHeader>
        <div className="product-card-heading flex items-start gap-4">
          <div className="product-card-thumbnail shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-muted/30 shadow-sm">
            <Image
              src={product.logo.src}
              alt={product.logo.alt}
              width={80}
              height={80}
              sizes="80px"
              className="h-20 w-20 object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="product-card-meta flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-primary">{product.localizedName}</span>
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                {product.publicStatus}
              </span>
            </div>
            <h3 className="mt-2 text-2xl font-semibold leading-none">{product.name}</h3>
          </div>
        </div>
        <CardDescription className="pt-2 text-base leading-7 text-foreground/80">{product.problem}</CardDescription>
      </CardHeader>
      <CardContent className="grow">
        <p className="text-sm leading-6 text-muted-foreground">{product.origin}</p>
      </CardContent>
      <CardFooter className={compact ? "flex-wrap gap-4" : "flex-wrap gap-x-5 gap-y-3"}>
        <Link
          href={`/products/${product.slug}`}
          className={`product-story-link inline-flex min-h-11 min-w-11 items-center gap-1.5 text-sm font-semibold text-primary hover:underline ${focusClasses}`}
        >
          제품 이야기
          <span className="sr-only">: {product.name}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <a
          href={primaryLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`official-product-link inline-flex min-h-11 min-w-11 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline ${focusClasses}`}
        >
          {primaryLink.label}
          <span className="sr-only">: {product.name}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">(새 창)</span>
        </a>
      </CardFooter>
    </Card>
  );
}
