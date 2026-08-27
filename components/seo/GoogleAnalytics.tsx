"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { googleAnalyticsMeasurementId } from "@/lib/google-analytics";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function trackPageView(pathname: string): void {
  if (!googleAnalyticsMeasurementId || typeof window.gtag !== "function") return;

  window.gtag("config", googleAnalyticsMeasurementId, {
    page_path: pathname,
  });
}

export function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!googleAnalyticsMeasurementId) return;

    const timer = window.setTimeout(() => trackPageView(pathname), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!googleAnalyticsMeasurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
window.gtag('js', new Date());
window.gtag('config', '${googleAnalyticsMeasurementId}', { send_page_view: false });`}
      </Script>
    </>
  );
}
