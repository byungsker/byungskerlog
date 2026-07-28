import { stackServerApp } from "@/stack/server";

interface AuthorizedUser {
  id: string;
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
  return isAdminUser(user.id);
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
