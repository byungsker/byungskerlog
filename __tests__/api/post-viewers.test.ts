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

describe("관리자 게시글 조회 IP GET /api/posts/[id]/viewers", () => {
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

  it("관리자에게 IP 집계만 반환하고 visitorId와 user-agent는 노출하지 않는다", async () => {
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
          viewCount: 3,
          firstSeen: new Date("2026-08-26T00:00:00.000Z"),
          lastSeen: new Date("2026-08-26T01:00:00.000Z"),
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
    expect(data.ips).toEqual([
      {
        ipAddress: "203.0.113.7",
        viewCount: 3,
        firstSeen: "2026-08-26T00:00:00.000Z",
        lastSeen: "2026-08-26T01:00:00.000Z",
      },
    ]);
    expect(data.ips[0]).not.toHaveProperty("visitorId");
    expect(data.ips[0]).not.toHaveProperty("userAgent");
    expect(data.pagination).toMatchObject({ page: 1, limit: 50, total: 2, totalPages: 1 });
  });
});
