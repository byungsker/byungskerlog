import { describe, expect, it } from "vitest";
import { getUtcDateOnly, parseAnalyticsDateRange } from "@/lib/analytics/date-range";

describe("analytics date range", () => {
  it("포함 날짜를 UTC 반개구간으로 변환한다", () => {
    const range = parseAnalyticsDateRange("2026-08-01", "2026-08-20");

    expect(range.gte.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(range.lt.toISOString()).toBe("2026-08-21T00:00:00.000Z");
  });

  it("잘못된 날짜와 역전된 기간을 거부한다", () => {
    expect(() => parseAnalyticsDateRange("2026-08-01", "2026-07-31")).toThrow(
      "endDate must be on or after startDate"
    );
    expect(() => parseAnalyticsDateRange("2026/08/01", "2026-08-20")).toThrow(
      "startDate must use YYYY-MM-DD format"
    );
    expect(() => parseAnalyticsDateRange("2026-08-01", null)).toThrow("startDate and endDate are required");
  });

  it("오늘 날짜도 UTC 기준으로 포맷한다", () => {
    expect(getUtcDateOnly(new Date("2026-08-20T23:59:59.999Z"))).toBe("2026-08-20");
  });
});
