import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidateTag } from "next/cache";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", async () => {
  const { mockPrisma } = await import("../mocks/prisma");
  return { prisma: mockPrisma };
});

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { GET, POST } from "@/app/api/posts/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);
const mockRevalidateTag = vi.mocked(revalidateTag);

function createGetRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function createPostRequest(path: string, body: object): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("게시글 목록 조회 GET /api/posts", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockRevalidateTag.mockReset();
  });

  it("게시글 목록을 성공적으로 조회한다", async () => {
    const mockPosts = [
      {
        id: "1",
        slug: "test-post",
        title: "테스트 포스트",
        content: "내용",
        excerpt: "발췌문",
        thumbnail: null,
        tags: [{ name: "test" }],
        type: "LONG",
        published: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        series: null,
        subSlug: null,
      },
    ];

    mockPrisma.post.count.mockResolvedValue(1);
    mockPrisma.post.findMany.mockResolvedValue(mockPosts);
    mockPrisma.readingSession.findMany.mockResolvedValue([]);

    const request = createGetRequest("/api/posts");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(1);
    expect(data.posts[0].title).toBe("테스트 포스트");
    expect(data.pagination.total).toBe(1);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ slug: { notIn: ["웹앱에서-스플래시-스크린-만들기"] } }),
      })
    );
  });

  it("쿼리 파라미터로 필터링할 수 있다", async () => {
    mockPrisma.post.count.mockResolvedValue(0);
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.readingSession.findMany.mockResolvedValue([]);

    const request = createGetRequest("/api/posts?tag=react&type=LONG&page=2&limit=10");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.posts).toHaveLength(0);
    expect(data.pagination.page).toBe(2);
    expect(data.pagination.limit).toBe(10);
  });

  it("비로그인 사용자는 비공개 게시글 목록을 요청할 수 없다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const response = await GET(createGetRequest("/api/posts?includeUnpublished=true"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
    expect(mockPrisma.post.findMany).not.toHaveBeenCalled();
  });

  it("관리자는 비공개 게시글을 포함해 조회할 수 있다", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "admin-1",
      primaryEmail: "admin@byungskerlog.com",
    } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.count.mockResolvedValue(0);
    mockPrisma.post.findMany.mockResolvedValue([]);
    mockPrisma.readingSession.findMany.mockResolvedValue([]);

    const response = await GET(createGetRequest("/api/posts?includeUnpublished=true"));

    expect(response.status).toBe(200);
    expect(mockPrisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});

describe("게시글 생성 POST /api/posts", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockPrisma.$queryRaw.mockResolvedValue([]);
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
  });

  it("인증된 사용자가 게시글을 생성할 수 있다", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "admin-1",
      primaryEmail: "admin@byungskerlog.com",
    } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.findFirst.mockResolvedValue(null);
    mockPrisma.post.create.mockResolvedValue({
      id: "new-post-1",
      slug: "new-post",
      title: "새 게시글",
      content: "내용입니다",
      excerpt: null,
      thumbnail: null,
      type: "LONG",
      published: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createPostRequest("/api/posts", {
      title: "새 게시글",
      slug: "new-post",
      content: "내용입니다",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("새 게시글");
    expect(mockPrisma.post.create).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith("posts", "max");
    expect(mockRevalidateTag).toHaveBeenCalledWith("short-posts", "max");
  });

  it("인증되지 않은 사용자는 401 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const request = createPostRequest("/api/posts", {
      title: "새 게시글",
      slug: "new-post",
      content: "내용입니다",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("관리자가 아닌 인증 사용자는 403 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "user-1",
      primaryEmail: "reader@example.com",
    } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(false);

    const response = await POST(
      createPostRequest("/api/posts", {
        title: "새 게시글",
        slug: "new-post",
        content: "내용입니다",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.code).toBe("FORBIDDEN");
    expect(mockPrisma.post.create).not.toHaveBeenCalled();
  });

  it("필수 필드가 누락되면 400 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue({
      id: "admin-1",
      primaryEmail: "admin@byungskerlog.com",
    } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);

    const request = createPostRequest("/api/posts", {
      title: "제목만",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});
