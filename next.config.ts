import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
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
}

export default nextConfig;
