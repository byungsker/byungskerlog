export const ADMIN_EMAILS = ["extreme0728@gmail.com", "admin@byungskerlog.com"] as const;

// The persistent QA member may exercise public authenticated flows, but is not an administrator.
export const AUTHORIZED_MEMBER_EMAILS = [...ADMIN_EMAILS, "tester@byungskerlog.com"] as const;

function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase();
  return normalized || null;
}

export function isAuthorizedMember(user: { primaryEmail?: string | null }): boolean {
  const email = normalizeEmail(user.primaryEmail);
  return email !== null && AUTHORIZED_MEMBER_EMAILS.includes(email as (typeof AUTHORIZED_MEMBER_EMAILS)[number]);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  return normalized !== null && ADMIN_EMAILS.includes(normalized as (typeof ADMIN_EMAILS)[number]);
}
