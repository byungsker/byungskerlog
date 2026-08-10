import type { NormalizedLinkedInShortImportRecord } from "@/lib/linkedin-short-import";
import type { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";

export type LinkedInImportPrisma = Pick<typeof prisma, "post">;

export interface LinkedInShortImportSummary {
  imported: number;
  skipped: number;
  created: number;
  updated: number;
}

function isSlugUniqueConstraintError(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error) || error.code !== "P2002") {
    return false;
  }

  if (!("meta" in error) || typeof error.meta !== "object" || error.meta === null || !("target" in error.meta)) {
    return false;
  }

  const target = error.meta.target;
  return Array.isArray(target) ? target.includes("slug") : typeof target === "string" && target.includes("slug");
}

async function generateAvailableSlug(prisma: LinkedInImportPrisma, title: string, sourceUrl: string, startCounter = 1) {
  const baseSlug = generateSlug(title) || `linkedin-${sourceUrl.split(":").pop()}`;
  let counter = startCounter;

  while (true) {
    const slug = counter === 1 ? baseSlug : `${baseSlug}-${counter}`;
    const existing = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return { nextCounter: counter + 1, slug };
    counter += 1;
  }
}

export async function importLinkedInShorts(
  records: readonly NormalizedLinkedInShortImportRecord[],
  prisma: LinkedInImportPrisma
): Promise<LinkedInShortImportSummary> {
  const importableRecords = records.filter(
    (record): record is NormalizedLinkedInShortImportRecord & { url: string } => record.url !== null
  );
  let created = 0;
  let updated = 0;

  for (const record of importableRecords) {
    const existing = await prisma.post.findFirst({
      where: { type: "SHORT", linkedinUrl: record.url },
      select: { id: true },
    });

    const data = {
      title: record.title,
      content: record.content,
      excerpt: record.content.replace(/\s+/g, " ").slice(0, 200),
      published: true,
      type: "SHORT" as const,
      linkedinUrl: record.url,
      createdAt: record.publishedAt,
    };

    if (existing) {
      await prisma.post.update({ where: { id: existing.id }, data });
      updated += 1;
      continue;
    }

    let { nextCounter, slug } = await generateAvailableSlug(prisma, record.title, record.url);

    while (true) {
      try {
        await prisma.post.create({ data: { ...data, slug } });
        created += 1;
        break;
      } catch (error) {
        if (!isSlugUniqueConstraintError(error)) {
          throw error;
        }

        ({ nextCounter, slug } = await generateAvailableSlug(prisma, record.title, record.url, nextCounter));
      }
    }
  }

  return {
    imported: created + updated,
    skipped: records.length - importableRecords.length,
    created,
    updated,
  };
}
