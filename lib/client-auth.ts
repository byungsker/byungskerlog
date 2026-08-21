"use client";

import { useUser } from "@stackframe/stack";
import { isAdminEmail } from "@/lib/auth-allowlist";

export { ADMIN_EMAILS } from "@/lib/auth-allowlist";

export function useIsAdmin(): boolean {
  const user = useUser();
  return isAdminEmail(user?.primaryEmail);
}
