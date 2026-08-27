const GOOGLE_ANALYTICS_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;

export function normalizeGoogleAnalyticsMeasurementId(value: string | undefined): string | null {
  const measurementId = value?.trim();

  return measurementId && GOOGLE_ANALYTICS_MEASUREMENT_ID_PATTERN.test(measurementId) ? measurementId : null;
}

export const googleAnalyticsMeasurementId = normalizeGoogleAnalyticsMeasurementId(
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
);
