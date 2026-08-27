import { describe, expect, it } from "vitest";
import { isAdminEmail, isAuthorizedMember } from "@/lib/auth-allowlist";

describe("인증 허용 목록", () => {
  it("관리자 이메일을 회원과 관리자로 인정한다", () => {
    expect(isAuthorizedMember({ primaryEmail: "admin@byungskerlog.com" })).toBe(true);
    expect(isAdminEmail("admin@byungskerlog.com")).toBe(true);
  });

  it("영속 QA 회원은 공개 인증 흐름만 허용하고 관리자로 인정하지 않는다", () => {
    expect(isAuthorizedMember({ primaryEmail: "TESTER@BYUNGSKERLOG.COM" })).toBe(true);
    expect(isAdminEmail("tester@byungskerlog.com")).toBe(false);
  });

  it("허용되지 않은 계정은 차단한다", () => {
    expect(isAuthorizedMember({ primaryEmail: "unknown@example.com" })).toBe(false);
    expect(isAuthorizedMember({ primaryEmail: null })).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });
});
