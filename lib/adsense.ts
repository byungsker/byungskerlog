const ADSENSE_CLIENT_ID_PATTERN = /^ca-pub-\d{16}$/;
const ADSENSE_SLOT_PATTERN = /^\d{10}$/;

export function normalizeAdsenseClientId(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && ADSENSE_CLIENT_ID_PATTERN.test(normalized) ? normalized : null;
}

export function normalizeAdsenseSlot(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  return normalized && ADSENSE_SLOT_PATTERN.test(normalized) ? normalized : null;
}
