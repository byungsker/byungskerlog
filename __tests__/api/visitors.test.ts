import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(),
}));

import { GET } from "@/app/api/visitors/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);

describe("GET /api/visitors", () => {
  beforeEach(() => {
    mockPrisma.$queryRaw.mockReset();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "admin-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
  });

  it("고유 visitorId와 UTC 오늘 방문자 수를 반환하고 공개 캐시를 사용하지 않는다", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ count: BigInt(2) }])
      .mockResolvedValueOnce([{ count: BigInt(8) }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ today: 2, total: 8 });
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
    expect(mockPrisma.$queryRaw.mock.calls[0][0]).toBeDefined();
    expect(mockPrisma.$queryRaw.mock.calls[1][0]).toBeDefined();
  });

  it("관리자가 아니면 고유 방문자 수를 반환하지 않는다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "member-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});
