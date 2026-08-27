import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-config";

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
