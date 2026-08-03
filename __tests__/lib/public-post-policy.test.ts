import { describe, expect, it } from "vitest";
import {
  getCanonicalPostSlug,
  getPublicPostSlugFilter,
  isPublicPostSlug,
  PUBLICLY_SUPPRESSED_POST_SLUGS,
} from "@/lib/public-post-policy";

describe("공개 포스트 URL 정책", () => {
  it("확인된 중복 URL을 대표 slug로 통합한다", () => {
    expect(getCanonicalPostSlug("웹앱에서-스플래시-스크린-만들기")).toBe("web-app-splash-screen");
    expect(getCanonicalPostSlug("unrelated-post")).toBe("unrelated-post");
  });

  it("중복 slug를 공개 조회 제외 조건으로 제공한다", () => {
    expect(getPublicPostSlugFilter()).toEqual({ notIn: [...PUBLICLY_SUPPRESSED_POST_SLUGS] });
    expect(isPublicPostSlug("웹앱에서-스플래시-스크린-만들기")).toBe(false);
    expect(isPublicPostSlug("web-app-splash-screen")).toBe(true);
  });
});
