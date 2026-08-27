export type PublicPostType = "LONG" | "SHORT";

// These are conservative, site-owned quality gates, not thresholds published by Google.
export const MIN_INDEXABLE_TEXT_LENGTH: Record<PublicPostType, number> = {
  LONG: 1_000,
  SHORT: 300,
};

const ADSENSE_TEXT_THRESHOLDS = {
  bottom: 1_500,
  middle: 3_000,
  top: 5_000,
} as const;

export function getMeaningfulTextLength(content: string): number {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/~~~[\s\S]*?~~~/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*~>_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim().length;
}

export function isPostIndexable(type: PublicPostType, content: string): boolean {
  return getMeaningfulTextLength(content) >= MIN_INDEXABLE_TEXT_LENGTH[type];
}

export interface AdsensePlacementEligibility {
  top: boolean;
  middle: boolean;
  bottom: boolean;
  any: boolean;
}

export function getAdsensePlacementEligibility(type: PublicPostType, content: string): AdsensePlacementEligibility {
  if (type !== "LONG") {
    return { top: false, middle: false, bottom: false, any: false };
  }

  const textLength = getMeaningfulTextLength(content);
  const eligibility = {
    top: textLength >= ADSENSE_TEXT_THRESHOLDS.top,
    middle: textLength >= ADSENSE_TEXT_THRESHOLDS.middle,
    bottom: textLength >= ADSENSE_TEXT_THRESHOLDS.bottom,
  };

  return { ...eligibility, any: eligibility.top || eligibility.middle || eligibility.bottom };
}
