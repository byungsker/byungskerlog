export interface AnalyticsDateRange {
  gte: Date;
  lt: Date;
}

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseUtcDateOnly(value: string, fieldName: string): Date {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new Error(`${fieldName} must use YYYY-MM-DD format`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is not a valid calendar date`);
  }

  return date;
}

/**
 * Converts inclusive date-only inputs into a UTC half-open interval.
 * The API and admin UI intentionally use UTC day boundaries so the selected
 * period does not vary with the server or browser's local timezone.
 */
export function parseAnalyticsDateRange(startDate?: string | null, endDate?: string | null): AnalyticsDateRange {
  if (!startDate || !endDate) {
    throw new Error("startDate and endDate are required");
  }

  const gte = parseUtcDateOnly(startDate, "startDate");
  const endStart = parseUtcDateOnly(endDate, "endDate");

  if (endStart < gte) {
    throw new Error("endDate must be on or after startDate");
  }

  const lt = new Date(endStart);
  lt.setUTCDate(lt.getUTCDate() + 1);

  return { gte, lt };
}

export function getUtcDateOnly(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
