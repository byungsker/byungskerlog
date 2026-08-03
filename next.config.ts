import type { NextConfig } from "next";
import { DUPLICATE_POST_REDIRECTS } from "./lib/public-post-policy";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...Object.entries(DUPLICATE_POST_REDIRECTS).map(([sourceSlug, destinationSlug]) => ({
        source: `/posts/${encodeURIComponent(sourceSlug)}`,
        destination: `/posts/${destinationSlug}`,
        permanent: true,
      })),
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.byungskerlog.com" }],
        destination: "https://byungskerlog.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "byungskerlog.vercel.app" }],
        destination: "https://byungskerlog.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "image.aladin.co.kr",
      },
    ],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
