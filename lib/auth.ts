import { stackServerApp } from "@/stack/server";
import { isAdminEmail } from "@/lib/auth-allowlist";

interface AuthorizedUser {
  id: string;
  primaryEmail?: string | null;
}

export async function getAuthUser() {
  if (!stackServerApp) {
    return null;
  }
  try {
    return await stackServerApp.getUser();
  } catch {
    return null;
  }
}

export function isAdminUser(userId: string): boolean {
  const adminUserIds =
    process.env.ADMIN_USER_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) || [];
  return adminUserIds.includes(userId);
}

export function isAuthorizedAdmin(user: AuthorizedUser): boolean {
  const adminUserIds =
    process.env.ADMIN_USER_IDS?.split(",")
      .map((id) => id.trim())
      .filter(Boolean) || [];

  // Keep the configured immutable IDs authoritative when present. Preview
  // deployments may omit this optional variable, so use the same verified
  // Stack Auth email allowlist that controls the administrator UI as a
  // compatibility fallback instead of signing an administrator out.
  return adminUserIds.length > 0 ? adminUserIds.includes(user.id) : isAdminEmail(user.primaryEmail);
}

export async function getAuthUserWithAdminCheck() {
  const user = await getAuthUser();
  if (!user) {
    return { user: null, isAdmin: false };
  }
  return {
    user,
    isAdmin: isAuthorizedAdmin(user),
  };
}
