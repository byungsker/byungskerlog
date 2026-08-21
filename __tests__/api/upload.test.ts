import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockPut, mockGetAuthUser, mockIsAuthorizedAdmin, mockCheckUserRateLimit } = vi.hoisted(() => ({
  mockPut: vi.fn(),
  mockGetAuthUser: vi.fn(),
  mockIsAuthorizedAdmin: vi.fn(),
  mockCheckUserRateLimit: vi.fn(),
}));

vi.mock("@vercel/blob", () => ({ put: mockPut }));
vi.mock("@/lib/auth", () => ({
  getAuthUser: mockGetAuthUser,
  isAuthorizedAdmin: mockIsAuthorizedAdmin,
}));
vi.mock("@/lib/rate-limit", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rate-limit")>("@/lib/rate-limit");
  return { ...actual, checkUserRateLimit: mockCheckUserRateLimit };
});

import { POST as upload } from "@/app/api/upload/route";
import { POST as uploadThumbnail } from "@/app/api/upload/thumbnail/route";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

function createRequest(path: string, body: BodyInit | null = PNG_BYTES, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: "POST",
    body,
    headers: {
      "content-type": "image/png",
      ...headers,
    },
  });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    mockPut.mockReset();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockCheckUserRateLimit.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "admin-1" });
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockCheckUserRateLimit.mockReturnValue({
      allowed: true,
      count: 1,
      remaining: 9,
      resetTime: Date.now() + 60000,
    });
    mockPut.mockResolvedValue({ url: "https://blob.test/image.png" });
  });

  it("비로그인 업로드를 거부한다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const response = await upload(createRequest("/api/upload?filename=image.png"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("관리자가 아닌 로그인 사용자의 업로드를 거부한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "member-1" });
    mockIsAuthorizedAdmin.mockReturnValue(false);

    const response = await upload(createRequest("/api/upload?filename=image.png"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("허용된 이미지 MIME과 signature를 검증한 뒤 랜덤 blob 이름으로 업로드한다", async () => {
    const response = await upload(createRequest("/api/upload?filename=../../unsafe name.png"));

    expect(response.status).toBe(200);
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringMatching(/^upload-[0-9a-f-]+-unsafe-name\.png$/),
      expect.any(Buffer),
      { access: "public", contentType: "image/png" }
    );
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("9");
  });

  it("허용되지 않은 MIME 또는 일치하지 않는 signature를 거부한다", async () => {
    const unsupportedResponse = await upload(
      createRequest("/api/upload?filename=script.svg", PNG_BYTES, { "content-type": "image/svg+xml" })
    );
    expect(unsupportedResponse.status).toBe(415);

    const mismatchedResponse = await upload(createRequest("/api/upload?filename=image.png", new Uint8Array([1, 2, 3])));
    expect(mismatchedResponse.status).toBe(415);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("선언된 파일 크기가 10 MiB를 넘으면 blob 저장 전에 거부한다", async () => {
    const response = await upload(
      createRequest("/api/upload?filename=image.png", PNG_BYTES, { "content-length": `${10 * 1024 * 1024 + 1}` })
    );

    expect(response.status).toBe(413);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("업로드 rate limit 초과 시 blob 저장을 실행하지 않는다", async () => {
    mockCheckUserRateLimit.mockReturnValue({
      allowed: false,
      count: 10,
      remaining: 0,
      resetTime: Date.now() + 60000,
    });

    const response = await upload(createRequest("/api/upload?filename=image.png"));
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("썸네일 업로드도 같은 관리자·파일 정책을 사용한다", async () => {
    const response = await uploadThumbnail(createRequest("/api/upload/thumbnail?filename=cover.png"));

    expect(response.status).toBe(200);
    expect(mockPut).toHaveBeenCalledWith(
      expect.stringMatching(/^thumbnail-[0-9a-f-]+-cover\.png$/),
      expect.any(Buffer),
      { access: "public", contentType: "image/png" }
    );
  });
});
