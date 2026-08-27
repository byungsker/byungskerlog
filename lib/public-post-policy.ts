export const DUPLICATE_POST_REDIRECTS: Readonly<Record<string, string>> = {
  "웹앱에서-스플래시-스크린-만들기": "web-app-splash-screen",
};

export const PUBLICLY_SUPPRESSED_POST_SLUGS = Object.freeze(Object.keys(DUPLICATE_POST_REDIRECTS));

export function getCanonicalPostSlug(slug: string): string {
  return DUPLICATE_POST_REDIRECTS[slug] ?? slug;
}

export function isPublicPostSlug(slug: string): boolean {
  return !PUBLICLY_SUPPRESSED_POST_SLUGS.includes(slug);
}

export function getPublicPostSlugFilter() {
  return { notIn: [...PUBLICLY_SUPPRESSED_POST_SLUGS] };
}
