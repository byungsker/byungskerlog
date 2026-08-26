import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stack/server", () => ({ stackServerApp: null }));

import { isAuthorizedAdmin } from "@/lib/auth";

describe("관리자 권한 판별", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("서버가 관리하는 불변 사용자 ID만 허용한다", () => {
    vi.stubEnv("ADMIN_USER_IDS", "admin-user-id, other-admin-id");

    expect(isAuthorizedAdmin({ id: "admin-user-id" })).toBe(true);
  });

  it("관리자 ID 환경설정이 있으면 관리자 이메일만으로 우회할 수 없다", () => {
    vi.stubEnv("ADMIN_USER_IDS", "admin-user-id");
    const attacker = {
      id: "attacker-id",
      primaryEmail: "admin@byungskerlog.com",
    };

    expect(isAuthorizedAdmin(attacker)).toBe(false);
  });

  it("관리자 ID 환경설정이 없는 프리뷰에서는 허용된 관리자 이메일을 사용한다", () => {
    vi.stubEnv("ADMIN_USER_IDS", "");

    expect(isAuthorizedAdmin({ id: "admin-user-id", primaryEmail: "ADMIN@BYUNGSKERLOG.COM" })).toBe(true);
    expect(isAuthorizedAdmin({ id: "member-id", primaryEmail: "tester@byungskerlog.com" })).toBe(false);
    expect(isAuthorizedAdmin({ id: "unknown-id", primaryEmail: "unknown@example.com" })).toBe(false);
  });
});
