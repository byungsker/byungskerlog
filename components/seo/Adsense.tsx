"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { normalizeAdsenseClientId, normalizeAdsenseSlot } from "@/lib/adsense";
import { useIsAdmin } from "@/lib/client-auth";

interface AdSenseProps {
  adClient?: string | null;
  adSlot: string;
  adFormat?: "auto" | "fluid";
  adLayoutKey?: string; // Required for In-feed ads (fluid format)
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

type WindowWithAdsbygoogle = Window & { adsbygoogle?: unknown[] };

const emptySubscribe = () => () => {};

export function AdSense({
  adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID,
  adSlot,
  adFormat = "auto",
  adLayoutKey,
  fullWidthResponsive = true,
  style,
  className,
}: AdSenseProps) {
  const normalizedClientId = normalizeAdsenseClientId(adClient);
  const normalizedSlot = normalizeAdsenseSlot(adSlot);
  const isAdmin = useIsAdmin();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const pushRef = useRef(false);
  const adElementRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const adElement = adElementRef.current;
    if (!mounted || isAdmin || !normalizedClientId || !normalizedSlot || !adElement || pushRef.current) return;

    if (adElement.dataset.adsbygoogleStatus) {
      pushRef.current = true;
      return;
    }

    try {
      const isInIframe = typeof window !== "undefined" && window.self !== window.top;
      if (isInIframe) return;

      const windowWithAds = window as WindowWithAdsbygoogle;
      (windowWithAds.adsbygoogle = windowWithAds.adsbygoogle || []).push({});
      pushRef.current = true;
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, [isAdmin, mounted, normalizedClientId, normalizedSlot]);

  if (!mounted || !normalizedClientId || !normalizedSlot || isAdmin) {
    return null;
  }

  // In-feed ad (fluid format) requires layout-key
  const isInFeedAd = adFormat === "fluid" && adLayoutKey;

  return (
    <div className={className} style={style}>
      <ins
        ref={adElementRef}
        className="adsbygoogle"
        style={{ display: "block", ...style }}
        data-ad-client={normalizedClientId}
        data-ad-slot={normalizedSlot}
        data-ad-format={adFormat}
        {...(isInFeedAd && { "data-ad-layout-key": adLayoutKey })}
        {...(!isInFeedAd && { "data-full-width-responsive": fullWidthResponsive.toString() })}
      />
    </div>
  );
}
