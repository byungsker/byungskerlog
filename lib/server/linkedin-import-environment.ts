import path from "node:path";

export const LINKEDIN_IMPORT_ENV_FILE = ".env.local";
export const DEVELOPMENT_DATABASE_HOST = "ep-wandering-tree-a11ymokd-pooler.ap-southeast-1.aws.neon.tech";

export function resolveLinkedInImportEnv(envFile = process.env.LINKEDIN_IMPORT_ENV) {
  if (envFile && envFile !== LINKEDIN_IMPORT_ENV_FILE) {
    throw new Error(`LinkedIn import is development-only and requires ${LINKEDIN_IMPORT_ENV_FILE}`);
  }

  return path.resolve(process.cwd(), LINKEDIN_IMPORT_ENV_FILE);
}

export function assertDevelopmentDatabaseUrl(databaseUrl = process.env.DATABASE_URL) {
  try {
    if (new URL(databaseUrl ?? "").hostname === DEVELOPMENT_DATABASE_HOST) {
      return;
    }
  } catch {
    // Reject malformed connection strings below.
  }

  throw new Error(`LinkedIn import requires the development Neon branch (${DEVELOPMENT_DATABASE_HOST})`);
}
