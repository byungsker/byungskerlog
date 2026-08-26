import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock("@/stack/server", () => ({
  stackServerApp: {
    getUser: mockGetUser,
  },
}));

import { middleware } from "@/middleware";

describe("관리자 페이지 미들웨어 인증", () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    vi.stubEnv("ADMIN_USER_IDS", "");
  });

  it("Preview에 관리자 ID 환경변수가 없어도 허용된 관리자 이메일을 유지한다", async () => {
    mockGetUser.mockResolvedValue({
      id: "preview-admin",
      primaryEmail: "admin@byungskerlog.com",
      primaryEmailVerified: true,
    });

    const response = await middleware(new NextRequest("https://preview.example.com/admin/posts"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("비로그인 사용자는 로그인 후 원래 관리자 페이지로 돌아간다", async () => {
    mockGetUser.mockResolvedValue(null);

    const response = await middleware(new NextRequest("https://preview.example.com/admin/posts"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://preview.example.com/handler/sign-in?after=%2Fadmin%2Fposts");
  });
});
