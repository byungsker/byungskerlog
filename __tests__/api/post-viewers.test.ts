import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", async () => {
  const { mockPrisma } = await import("../mocks/prisma");
  return { prisma: mockPrisma };
});

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(),
}));

import { GET } from "@/app/api/posts/[id]/viewers/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("관리자 게시글 조회 기록 GET /api/posts/[id]/viewers", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
  });

  it("비로그인 사용자는 조회 IP를 볼 수 없다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const response = await GET(createRequest("/api/posts/post-1/viewers"), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(response.status).toBe(401);
    expect(mockPrisma.post.findUnique).not.toHaveBeenCalled();
  });

  it("관리자가 아니면 조회 IP를 볼 수 없다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(false);

    const response = await GET(createRequest("/api/posts/post-1/viewers"), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(response.status).toBe(403);
    expect(mockPrisma.post.findUnique).not.toHaveBeenCalled();
  });

  it("관리자에게 조회 기록별 IP, visitorId, user-agent 원문을 반환한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "admin-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.findUnique.mockResolvedValue({ id: "post-1", title: "테스트 포스트" });
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([
        {
          uniqueVisitorCount: 3,
          uniqueIpCount: 2,
          viewRecords: 5,
          viewRecordsWithIp: 4,
        },
      ])
      .mockResolvedValueOnce([
        {
          ipAddress: "203.0.113.7",
          visitorId: "visitor-1",
          userAgent: "Mozilla/5.0 (Test Browser)",
          viewedAt: new Date("2026-08-26T01:00:00.000Z"),
        },
        {
          ipAddress: null,
          visitorId: "visitor-2",
          userAgent: "unknown",
          viewedAt: new Date("2026-08-26T00:00:00.000Z"),
        },
      ]);

    const response = await GET(createRequest("/api/posts/post-1/viewers?page=1&limit=50"), {
      params: Promise.resolve({ id: "post-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.summary).toEqual({
      uniqueVisitorCount: 3,
      uniqueIpCount: 2,
      viewRecords: 5,
      viewRecordsWithIp: 4,
      viewRecordsWithoutIp: 1,
    });
    expect(data.records).toEqual([
      {
        ipAddress: "203.0.113.7",
        visitorId: "visitor-1",
        userAgent: "Mozilla/5.0 (Test Browser)",
        viewedAt: "2026-08-26T01:00:00.000Z",
      },
      {
        ipAddress: null,
        visitorId: "visitor-2",
        userAgent: "unknown",
        viewedAt: "2026-08-26T00:00:00.000Z",
      },
    ]);
    expect(data.records[0]).toMatchObject({ visitorId: "visitor-1", userAgent: "Mozilla/5.0 (Test Browser)" });
    expect(data.pagination).toMatchObject({ page: 1, limit: 50, total: 5, totalPages: 1 });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
