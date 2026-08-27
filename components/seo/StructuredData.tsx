import { siteConfig } from "@/lib/site-config";

const siteUrl = siteConfig.url;

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface StructuredDataProps {
  type: "website" | "blog" | "article" | "faq" | "breadcrumb";
  data?: {
    title?: string;
    description?: string;
    image?: string;
    slug?: string;
    datePublished?: string;
    dateModified?: string;
    tags?: string[];
    faqItems?: FAQItem[];
    breadcrumbs?: BreadcrumbItem[];
  };
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const getStructuredData = () => {
    const baseOrganization = {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Byungsker Log",
      alternateName: [
        "byungskerlog",
        "병스커로그",
        "병스커 블로그",
        "병스커",
        "병로그",
        "Byungsker",
        "기술블로그",
        "개발블로그",
      ],
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo-byungsker.png`,
        width: 400,
        height: 186,
      },
    };

    const baseWebSite = {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "Byungsker Log",
      alternateName: [
        "byungskerlog",
        "병스커로그",
        "병스커 블로그",
        "병스커",
        "병로그",
        "Byungsker",
        "기술블로그",
        "개발블로그",
      ],
      url: siteUrl,
      description: "제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "ko-KR",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/posts?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    };

    const baseBlog = {
      "@type": "Blog",
      "@id": `${siteUrl}/#blog`,
      name: "Byungsker Log",
      url: siteUrl,
      description: "제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그",
      publisher: { "@id": `${siteUrl}/#organization` },
      isPartOf: { "@id": `${siteUrl}/#website` },
      inLanguage: "ko-KR",
    };

    if (type === "website" || type === "blog") {
      return {
        "@context": "https://schema.org",
        "@graph": [baseOrganization, baseWebSite, baseBlog],
      };
    }

    if (type === "article" && data) {
      const articleSchema = {
        "@type": "BlogPosting",
        "@id": `${siteUrl}/posts/${data.slug}/#article`,
        headline: data.title,
        description: data.description,
        image: data.image || `${siteUrl}/og-image.png`,
        datePublished: data.datePublished,
        dateModified: data.dateModified,
        author: {
          "@type": "Person",
          "@id": `${siteUrl}/#author`,
          name: "병스커 (Byungsker)",
          url: siteUrl,
        },
        publisher: { "@id": `${siteUrl}/#organization` },
        isPartOf: { "@id": `${siteUrl}/#blog` },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${siteUrl}/posts/${data.slug}`,
        },
        keywords: data.tags?.join(", "),
        inLanguage: "ko-KR",
      };
      return {
        "@context": "https://schema.org",
        "@graph": [baseOrganization, baseWebSite, baseBlog, articleSchema],
      };
    }

    if (type === "faq" && data?.faqItems && data.faqItems.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      };
    }

    if (type === "breadcrumb" && data?.breadcrumbs && data.breadcrumbs.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: data.breadcrumbs.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      };
    }

    return {
      "@context": "https://schema.org",
      "@graph": [baseOrganization, baseWebSite, baseBlog],
    };
  };

  const structuredData = getStructuredData();
  const serializedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializedStructuredData }}
    />
  );
}
