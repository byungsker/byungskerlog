import { describe, expect, it } from "vitest";
import { normalizeGoogleAnalyticsMeasurementId } from "@/lib/google-analytics";

describe("Google Analytics 측정 ID", () => {
  it("유효한 GA4 측정 ID의 앞뒤 공백을 정리한다", () => {
    expect(normalizeGoogleAnalyticsMeasurementId("  G-Q3KCH6Q8LZ\n")).toBe("G-Q3KCH6Q8LZ");
  });

  it.each([undefined, "", "G-", "UA-123456-1", "g-q3kch6q8lz", "G-Q3KCH6Q8LZ'\n<script>"]) (
    "잘못된 측정 ID(%s)를 비활성화한다",
    (value) => {
      expect(normalizeGoogleAnalyticsMeasurementId(value)).toBeNull();
    }
  );
});
