import type { PrismaClient } from "@prisma/client";
import type { NormalizedLinkedInShortImportRecord } from "@/lib/linkedin-short-import";
import { generateSlug } from "@/lib/utils/slug";

export type LinkedInImportPrisma = Pick<PrismaClient, "post">;

export interface LinkedInShortImportSummary {
  imported: number;
  skipped: number;
  created: number;
  updated: number;
}

async function generateAvailableSlug(prisma: LinkedInImportPrisma, title: string, sourceUrl: string) {
  const baseSlug = generateSlug(title) || `linkedin-${sourceUrl.split(":").pop()}`;
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
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

    const slug = await generateAvailableSlug(prisma, record.title, record.url);
    await prisma.post.create({ data: { ...data, slug } });
    created += 1;
  }

  return {
    imported: created + updated,
    skipped: records.length - importableRecords.length,
    created,
    updated,
  };
}
