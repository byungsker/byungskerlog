"use client";

import { useEffect } from "react";
import { useIsAdmin } from "@/lib/client-auth";
import { normalizeAdsenseClientId } from "@/lib/adsense";

const ADSENSE_SCRIPT_ID = "google-adsense-script";
let adsenseLibraryLoaded = false;

interface ConditionalAdsenseScriptProps {
  clientId: string;
}

export function ConditionalAdsenseScript({ clientId }: ConditionalAdsenseScriptProps) {
  const isAdmin = useIsAdmin();
  const normalizedClientId = normalizeAdsenseClientId(clientId);

  useEffect(() => {
    const existingScript = document.getElementById(ADSENSE_SCRIPT_ID);

    if (isAdmin || !normalizedClientId) {
      existingScript?.remove();
      return;
    }

    if (existingScript || adsenseLibraryLoaded) {
      return () => existingScript?.remove();
    }

    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${normalizedClientId}`;
    script.crossOrigin = "anonymous";
    script.addEventListener("load", () => {
      adsenseLibraryLoaded = true;
    });
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [isAdmin, normalizedClientId]);

  return null;
}
