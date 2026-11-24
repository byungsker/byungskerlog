import { siteConfig } from "@/lib/site-config";

const siteUrl = siteConfig.url;
const siteDescription =
  "프로덕트 엔지니어 (Product Engineer) 병스커의 개발 블로그. Frontend Engineer (FE), Software Engineer로서 제품 개발 경험과 기술 인사이트를 공유합니다.";

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
      name: siteConfig.siteName,
      alternateName: ["병스커로그", "Byungsker Log"],
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
      name: siteConfig.siteName,
      alternateName: ["병스커로그", "Byungsker Log"],
      url: siteUrl,
      description: siteDescription,
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
      name: siteConfig.name,
      url: siteUrl,
      description: siteDescription,
      publisher: { "@id": `${siteUrl}/#organization` },
      isPartOf: { "@id": `${siteUrl}/#website` },
      inLanguage: "ko-KR",
    };

    const baseAuthor = {
      "@type": "Person",
      "@id": `${siteUrl}/#author`,
      name: "병스커",
      alternateName: "Byungsker",
      url: "https://byungsker.com/",
      jobTitle: ["Product Engineer", "Frontend Engineer (FE)", "Software Engineer"],
      description: siteDescription,
      knowsAbout: [
        "Product engineering",
        "Frontend (FE)",
        "Frontend engineering",
        "Software engineering",
        "Next.js",
        "React",
        "TypeScript",
      ],
      sameAs: ["https://github.com/byungsker", "https://linkedin.com/in/byungsker"],
    };

    if (type === "website" || type === "blog") {
      return {
        "@context": "https://schema.org",
        "@graph": [baseOrganization, baseWebSite, baseBlog, baseAuthor],
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
          url: "https://byungsker.com/",
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
        "@graph": [baseOrganization, baseWebSite, baseBlog, baseAuthor, articleSchema],
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
      "@graph": [baseOrganization, baseWebSite, baseBlog, baseAuthor],
    };
  };

  const structuredData = getStructuredData();
  const serializedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializedStructuredData }} />;
}
