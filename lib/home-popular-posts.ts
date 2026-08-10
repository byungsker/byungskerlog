export interface HistoricalPopularPostSeed {
  title: string;
  slug: string;
  publishedAt: string;
  legacyUrl: string;
}

export function createCalendarDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new RangeError("Expected date in YYYY-MM-DD format");
  }

  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(year, month - 1, day);

  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) {
    throw new RangeError(`Invalid calendar date: ${date}`);
  }

  return result;
}

/**
 * Editorially selected historical posts. Keep this order stable: live metrics
 * enrich these records but never choose or reorder homepage entries.
 */
export const HISTORICAL_POPULAR_POSTS: readonly HistoricalPopularPostSeed[] = [
  {
    title: "Fluttrer Web에서 Javascript 유연하게 사용하기 (feat. JS interop의 A to Z)",
    slug: "fluttrer-web에서-javascript-유연하게-사용하기",
    publishedAt: "2024-11-10",
    legacyUrl: "https://byungskerlog.com/posts/fluttrer-web에서-javascript-유연하게-사용하기",
  },
  {
    title: "TeoConf2024 스피커 후기",
    slug: "teoconf2024-스피커-후기-bloj8ivk",
    publishedAt: "2025-02-10",
    legacyUrl: "https://byungskerlog.com/posts/teoconf2024-스피커-후기-bloj8ivk",
  },
  {
    title: "피그마 무료 플랜에서 컬러 코드 추출 자동화하기! (feat. Figmable CLI 배포)",
    slug: "figmable-cli-배포무료플랜에서-피그마-rest-api로-토큰-가져오기",
    publishedAt: "2025-03-16",
    legacyUrl: "https://byungskerlog.com/posts/figmable-cli-배포무료플랜에서-피그마-rest-api로-토큰-가져오기",
  },
  {
    title: "짧고 빠르게 Storybook 도입하기!",
    slug: "내-프로젝트에-짧고-빠르게-storybook-도입하기",
    publishedAt: "2025-01-19",
    legacyUrl: "https://byungskerlog.com/posts/내-프로젝트에-짧고-빠르게-storybook-도입하기",
  },
];
