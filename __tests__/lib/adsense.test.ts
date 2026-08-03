import { describe, expect, it } from "vitest";
import { normalizeAdsenseClientId, normalizeAdsenseSlot } from "@/lib/adsense";

describe("AdSense 환경값 정규화", () => {
  it("앞뒤 공백과 줄바꿈을 제거한 유효한 값을 반환한다", () => {
    expect(normalizeAdsenseClientId("  ca-pub-1234567890123456\n")).toBe("ca-pub-1234567890123456");
    expect(normalizeAdsenseSlot(" 1234567890\n")).toBe("1234567890");
  });

  it("비어 있거나 형식이 잘못된 값은 거부한다", () => {
    expect(normalizeAdsenseClientId(undefined)).toBeNull();
    expect(normalizeAdsenseClientId("pub-1234")).toBeNull();
    expect(normalizeAdsenseClientId("ca-pub-1")).toBeNull();
    expect(normalizeAdsenseSlot("")).toBeNull();
    expect(normalizeAdsenseSlot("slot-1234")).toBeNull();
    expect(normalizeAdsenseSlot("1234")).toBeNull();
  });
});
