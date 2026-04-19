import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackClientApp } from "../stack/client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Providers } from "./providers";
import { StructuredData } from "@/components/seo/StructuredData";
import { ConditionalAdsenseScript } from "@/components/seo/ConditionalAdsenseScript";
import { Toaster } from "@/components/ui/Sonner";
import { ImageProtection } from "@/components/common/ImageProtection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Byungsker Log - 병스커의 기술 블로그",
    template: "%s | Byungsker Log",
  },
  description:
    "제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그. 소프트웨어 개발, 제품 개발, 스타트업에 대한 인사이트를 공유합니다.",
  keywords: [
    "병스커",
    "Byungsker",
    "병스커로그",
    "byungskerlog",
    "병스커 블로그",
    "byungsker 블로그",
    "병로그",
    "기술블로그",
    "개발블로그",
    "기술 블로그",
    "개발 블로그",
    "소프트웨어 개발",
    "제품 주도 개발",
    "Product-Led Development",
    "스타트업",
    "프론트엔드",
    "웹개발",
    "Next.js",
    "React",
    "TypeScript",
  ],
  authors: [{ name: "병스커 (Byungsker)" }],
  creator: "병스커 (Byungsker)",
  publisher: "병스커 (Byungsker)",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    alternateLocale: ["en_US"],
    url: siteUrl,
    siteName: "Byungsker Log",
    title: "Byungsker Log",
    description:
      "제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그. 소프트웨어 개발, 제품 개발, 스타트업에 대한 인사이트를 공유합니다.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Byungsker Log",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Byungsker Log",
    description: "제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그",
    images: [`${siteUrl}/og-image.png`],
    creator: "@byungsker",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "ZS-R9rw5s4aTZLs39lPouKDbOCDWzoPTuK7-FTJWE9A",
    other: {
      "naver-site-verification": "b5fe47a6ed7b521763b6c03524d676baba809a52",
    },
  },
  other: {
    subject: "기술 블로그, 개발 블로그, 병스커로그",
    classification: "Blog, Technology, Software Development",
    rating: "General",
    distribution: "Global",
    "revisit-after": "7 days",
    "article:author": "병스커 (Byungsker)",
    "article:section": "Technology",
  },
  applicationName: "Byungsker Log",
  appleWebApp: {
    title: "Byungsker Log",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const adSenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", geistSans.variable, geistMono.variable)}>
        <StructuredData type="blog" />
        {adSenseClientId && <ConditionalAdsenseScript clientId={adSenseClientId} />}
        {stackClientApp ? (
          <StackProvider app={stackClientApp}>
            <StackTheme>
              <ThemeProvider>
                <Providers>
                  <div className="relative flex min-h-screen flex-col">
                    <Header />
                    <main className="flex-1">{children}</main>
                    <Footer />
                  </div>
                  <Toaster />
                  <ImageProtection />
                </Providers>
              </ThemeProvider>
            </StackTheme>
          </StackProvider>
        ) : (
          <ThemeProvider>
            <Providers>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
              <Toaster />
              <ImageProtection />
            </Providers>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
