import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";
import { normalizeLinkedInShortImport } from "@/lib/linkedin-short-import";
import { assertDevelopmentDatabaseUrl, resolveLinkedInImportEnv } from "@/lib/server/linkedin-import-environment";
import { importLinkedInShorts } from "@/lib/server/linkedin-short-persistence";

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

async function main() {
  const rawRecords: unknown = JSON.parse(await readFile(path.resolve(process.cwd(), inputPath), "utf8"));
  if (!Array.isArray(rawRecords)) {
    throw new Error("LinkedIn import input must be a JSON array");
  }

  const records = normalizeLinkedInShortImport(rawRecords);
  const { prisma } = await import("@/lib/prisma");

  try {
    const summary = await importLinkedInShorts(records, prisma);
    console.log(JSON.stringify({ ...summary, skipped: rawRecords.length - summary.imported }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
