import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stack/server", () => ({ stackServerApp: null }));

import { isAuthorizedAdmin } from "@/lib/auth";

describe("isAuthorizedAdmin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("서버가 관리하는 불변 사용자 ID만 허용한다", () => {
    vi.stubEnv("ADMIN_USER_IDS", "admin-user-id, other-admin-id");

    expect(isAuthorizedAdmin({ id: "admin-user-id" })).toBe(true);
  });

  it("관리자 이메일을 주장하더라도 다른 사용자 ID는 거부한다", () => {
    vi.stubEnv("ADMIN_USER_IDS", "admin-user-id");
    const attacker = {
      id: "attacker-id",
      primaryEmail: "admin@byungskerlog.com",
    };

    expect(isAuthorizedAdmin(attacker)).toBe(false);
  });

  it("관리자 ID 환경설정이 없으면 모든 사용자를 거부한다", () => {
    vi.stubEnv("ADMIN_USER_IDS", "");

    expect(isAuthorizedAdmin({ id: "admin-user-id" })).toBe(false);
  });
});
