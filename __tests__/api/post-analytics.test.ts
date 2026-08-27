import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mockPrisma = vi.hoisted(() => ({
  post: { findMany: vi.fn() },
  $queryRaw: vi.fn(),
  readingSession: { groupBy: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(),
}));

import { GET } from "@/app/api/posts/analytics/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);

function createRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/posts/analytics?${query}`);
}

describe("GET /api/posts/analytics", () => {
  beforeEach(() => {
    mockPrisma.post.findMany.mockReset();
    mockPrisma.$queryRaw.mockReset();
    mockPrisma.readingSession.groupBy.mockReset();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "admin-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
  });

  it("고유 사용자 조회는 PostView.viewedAt 기간으로만 집계한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([{ id: "post-1", title: "조회 글", slug: "viewed-post" }]);
    mockPrisma.$queryRaw.mockResolvedValue([{ postId: "post-1", count: BigInt(3) }]);

    const response = await GET(
      createRequest("startDate=2026-08-01&endDate=2026-08-20&type=LONG&statType=views")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ title: "조회 글", slug: "viewed-post", views: 3 }]);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
      where: { published: true, type: "LONG" },
      select: { id: true, title: true, slug: true },
    });
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
    expect(mockPrisma.$queryRaw.mock.calls[0][0]).toBeDefined();
  });

  it("고유 사용자 조회가 없으면 공개 글을 0건 막대보다 빈 상태로 반환한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([{ id: "post-1", title: "조회 없는 글", slug: "no-view" }]);
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const response = await GET(
      createRequest("startDate=2026-08-01&endDate=2026-08-01&type=all&statType=views")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("태그와 글 생성 추이는 Post.createdAt 기간의 공개 글 인벤토리다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([{ tags: [{ name: "TypeScript" }] }]);

    const categoryResponse = await GET(
      createRequest("startDate=2026-08-01&endDate=2026-08-01&type=all&statType=category")
    );

    expect(categoryResponse.status).toBe(200);
    expect(await categoryResponse.json()).toEqual([{ tag: "TypeScript", count: 1 }]);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
      where: {
        published: true,
        createdAt: {
          gte: new Date("2026-08-01T00:00:00.000Z"),
          lt: new Date("2026-08-02T00:00:00.000Z"),
        },
      },
      select: { tags: { select: { name: true } } },
    });

    mockPrisma.post.findMany.mockReset();
    mockPrisma.post.findMany.mockResolvedValue([{ createdAt: new Date("2026-08-01T12:00:00.000Z") }]);

    const countResponse = await GET(
      createRequest("startDate=2026-08-01&endDate=2026-08-01&type=all&statType=count")
    );

    expect(countResponse.status).toBe(200);
    expect(await countResponse.json()).toEqual([{ date: "2026-08-01", count: 1 }]);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
      where: {
        published: true,
        createdAt: {
          gte: new Date("2026-08-01T00:00:00.000Z"),
          lt: new Date("2026-08-02T00:00:00.000Z"),
        },
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  });

  it("읽기 지표는 ReadingSession.createdAt 기간의 세션 레코드만 집계한다", async () => {
    mockPrisma.post.findMany.mockResolvedValue([{ id: "post-1", title: "Long 글", slug: "long-post" }]);
    mockPrisma.readingSession.groupBy
      .mockResolvedValueOnce([
        { postId: "post-1", _count: { id: 2 }, _avg: { maxScrollDepth: 75 } },
      ])
      .mockResolvedValueOnce([{ postId: "post-1", _count: { id: 1 } }]);

    const response = await GET(
      createRequest("startDate=2026-08-01&endDate=2026-08-20&type=LONG&statType=reading")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { title: "Long 글", slug: "long-post", sessions: 2, avgDepth: 75, completionRate: 50 },
    ]);
    expect(mockPrisma.readingSession.groupBy).toHaveBeenNthCalledWith(1, {
      by: ["postId"],
      where: {
        postId: { in: ["post-1"] },
        createdAt: {
          gte: new Date("2026-08-01T00:00:00.000Z"),
          lt: new Date("2026-08-21T00:00:00.000Z"),
        },
      },
      _count: { id: true },
      _avg: { maxScrollDepth: true },
    });
    expect(mockPrisma.readingSession.groupBy).toHaveBeenNthCalledWith(2, {
      by: ["postId"],
      where: {
        postId: { in: ["post-1"] },
        completed: true,
        createdAt: {
          gte: new Date("2026-08-01T00:00:00.000Z"),
          lt: new Date("2026-08-21T00:00:00.000Z"),
        },
      },
      _count: { id: true },
    });
  });

  it("관리자가 아니면 통계 데이터를 조회하지 않는다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "member-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(false);

    const response = await GET(createRequest("startDate=2026-08-01&endDate=2026-08-01&statType=views"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
    expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
  });

  it("날짜와 글 유형을 검증한다", async () => {
    const invalidDateResponse = await GET(
      createRequest("startDate=2026/08/01&endDate=2026-08-01&type=all&statType=views")
    );
    expect(invalidDateResponse.status).toBe(400);

    const invalidTypeResponse = await GET(
      createRequest("startDate=2026-08-01&endDate=2026-08-01&type=UNKNOWN&statType=views")
    );
    expect(invalidTypeResponse.status).toBe(400);
  });
});
