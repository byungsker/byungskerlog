import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

const siteUrl = siteConfig.url;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/handler/",
          "/books/",
          "/posts/*/opengraph-image",
          "/short/*/opengraph-image",
          "/_next/static/media/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/handler/",
          "/books/",
          "/posts/*/opengraph-image",
          "/short/*/opengraph-image",
          "/_next/static/media/",
        ],
      },
      {
        userAgent: "Yeti",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/handler/",
          "/books/",
          "/posts/*/opengraph-image",
          "/short/*/opengraph-image",
          "/_next/static/media/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
