import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { generateSlug } from "@/lib/utils/slug";
import { normalizeLinkedInShortImport } from "@/lib/linkedin-short-import";
import { assertDevelopmentDatabaseUrl, resolveLinkedInImportEnv } from "@/lib/server/linkedin-import-environment";

const envFile = resolveLinkedInImportEnv();
const envResult = config({ path: envFile, override: true });

if (envResult.error) {
  throw new Error(`Unable to load ${envFile}: ${envResult.error.message}`);
}

assertDevelopmentDatabaseUrl();

const inputPath = process.argv[2];

if (!inputPath) {
  throw new Error("Usage: npx tsx lib/server/import-linkedin-shorts.ts <records.json>");
}

const prisma = new PrismaClient();

async function generateAvailableSlug(title: string, sourceUrl: string, currentSlug?: string) {
  const baseSlug = generateSlug(title) || `linkedin-${sourceUrl.split(":").pop()}`;
  let slug = currentSlug || baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) return slug;
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

async function main() {
  const rawRecords = JSON.parse(await readFile(path.resolve(process.cwd(), inputPath), "utf8"));
  const records = normalizeLinkedInShortImport(rawRecords);
  const importableRecords = records.filter((record): record is typeof record & { url: string } => record.url !== null);
  const skipped = records.length - importableRecords.length;
  let created = 0;
  let updated = 0;

  for (const record of importableRecords) {
    const existing = await prisma.post.findFirst({
      where: { type: "SHORT", linkedinUrl: record.url },
      select: { id: true, slug: true },
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

    const slug = await generateAvailableSlug(record.title, record.url);
    await prisma.post.create({ data: { ...data, slug } });
    created += 1;
  }

  console.log(JSON.stringify({ imported: created + updated, skipped, created, updated }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
