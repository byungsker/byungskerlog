"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const DISALLOWED_PREFIXES = ["/books", "/admin", "/handler", "/api"];

interface ConditionalAdsenseScriptProps {
  clientId: string;
}

export function ConditionalAdsenseScript({ clientId }: ConditionalAdsenseScriptProps) {
  const pathname = usePathname();

  if (!pathname) {
    return null;
  }

  const isDisallowed = DISALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isDisallowed) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
