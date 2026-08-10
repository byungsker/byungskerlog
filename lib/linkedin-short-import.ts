export interface LinkedInShortImportRecord {
  title: string;
  content: string;
  publishedAt: string;
  url?: string;
}

export interface NormalizedLinkedInShortImportRecord {
  title: string;
  content: string;
  publishedAt: Date;
  url: string | null;
}

/**
 * Import boundary: records may come from an account-owner export, an
 * explicitly authorized provider, or an authenticated account-owner browser
 * capture. The importer creates published `SHORT` posts in `publishedAt`
 * descending order and preserves the source URL in `linkedinUrl`.
 */
export const LINKEDIN_SHORT_IMPORT_CONTRACT = Object.freeze({
  source: "account-owner export, authorized provider, or authenticated account-owner capture",
  target: "published SHORT posts ordered by publishedAt descending",
  prohibited: "unauthorized public-profile crawling or third-party account access",
});

/**
 * Normalizes records supplied by the account owner or an authorized provider.
 * Fetching and authentication remain outside this pure data boundary.
 */
function isLinkedInShortImportRecord(record: unknown): record is LinkedInShortImportRecord {
  if (!record || typeof record !== "object") {
    return false;
  }

  const candidate = record as Partial<LinkedInShortImportRecord>;
  return (
    typeof candidate.title === "string" &&
    typeof candidate.content === "string" &&
    typeof candidate.publishedAt === "string" &&
    (candidate.url === undefined || typeof candidate.url === "string")
  );
}

function normalizeLinkedInPostUrl(url: string | undefined): string | null {
  if (!url?.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(url.trim());
    const isLinkedInHost = parsedUrl.hostname === "linkedin.com" || parsedUrl.hostname === "www.linkedin.com";
    const isPostUrl = parsedUrl.pathname.startsWith("/posts/") || parsedUrl.pathname.startsWith("/feed/update/");
    const hasDefaultHttpsAuthority = parsedUrl.username === "" && parsedUrl.password === "" && parsedUrl.port === "";

    return parsedUrl.protocol === "https:" && hasDefaultHttpsAuthority && isLinkedInHost && isPostUrl
      ? parsedUrl.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeLinkedInShortImport(records: readonly unknown[]): NormalizedLinkedInShortImportRecord[] {
  return records
    .filter(isLinkedInShortImportRecord)
    .map((record) => {
      const title = record.title.trim();
      const content = record.content.trim();
      const publishedAt = new Date(record.publishedAt);
      const url = normalizeLinkedInPostUrl(record.url);

      if (!title || !content || Number.isNaN(publishedAt.getTime())) {
        return null;
      }

      return { title, content, publishedAt, url };
    })
    .filter((record): record is NormalizedLinkedInShortImportRecord => record !== null)
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
