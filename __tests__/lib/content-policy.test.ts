import { describe, expect, it } from "vitest";
import { getAdsensePlacementEligibility, getMeaningfulTextLength, isPostIndexable } from "@/lib/content-policy";

describe("공개 콘텐츠 품질 정책", () => {
  it("코드, 이미지와 URL을 본문 가치 길이에서 제외한다", () => {
    const content =
      "설명입니다.\n```ts\n" + "const value = 1;\n".repeat(100) + "```\n![이미지](image.png)\nhttps://example.com";

    expect(getMeaningfulTextLength(content)).toBe("설명입니다.".length);
  });

  it("LONG과 SHORT에 서로 다른 색인 최소 기준을 적용한다", () => {
    expect(isPostIndexable("LONG", "가".repeat(999))).toBe(false);
    expect(isPostIndexable("LONG", "가".repeat(1_000))).toBe(true);
    expect(isPostIndexable("SHORT", "가".repeat(299))).toBe(false);
    expect(isPostIndexable("SHORT", "가".repeat(300))).toBe(true);
  });

  it("SHORT에는 광고를 게재하지 않고 LONG 길이에 따라 광고 수를 제한한다", () => {
    expect(getAdsensePlacementEligibility("SHORT", "가".repeat(10_000))).toEqual({
      top: false,
      middle: false,
      bottom: false,
      any: false,
    });
    expect(getAdsensePlacementEligibility("LONG", "가".repeat(1_499)).any).toBe(false);
    expect(getAdsensePlacementEligibility("LONG", "가".repeat(1_500))).toEqual({
      top: false,
      middle: false,
      bottom: true,
      any: true,
    });
    expect(getAdsensePlacementEligibility("LONG", "가".repeat(3_000))).toEqual({
      top: false,
      middle: true,
      bottom: true,
      any: true,
    });
    expect(getAdsensePlacementEligibility("LONG", "가".repeat(5_000))).toEqual({
      top: true,
      middle: true,
      bottom: true,
      any: true,
    });
  });
});
