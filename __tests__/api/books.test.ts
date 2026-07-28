import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

// Mock Prisma before importing the route
import { vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

import { GET, POST } from "@/app/api/books/route";
import { getAuthUser } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);

function createPostRequest(body: object): NextRequest {
  return new NextRequest(new URL("/api/books", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/books", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("책 목록을 성공적으로 조회한다", async () => {
    const mockBooks = [
      {
        id: "book-1",
        title: "클린 코드",
        author: "로버트 C. 마틴",
        slug: "clean-code",
        coverImage: "https://example.com/clean-code.jpg",
        readAt: new Date("2024-01-15"),
        summary: "좋은 코드를 작성하는 방법",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        _count: { posts: 3 },
      },
      {
        id: "book-2",
        title: "리팩터링",
        author: "마틴 파울러",
        slug: "refactoring",
        coverImage: "https://example.com/refactoring.jpg",
        readAt: new Date("2024-01-10"),
        summary: "코드 개선 기법",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
        _count: { posts: 2 },
      },
    ];

    mockPrisma.book.findMany.mockResolvedValue(mockBooks);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe("클린 코드");
    expect(data[0]._count.posts).toBe(3);
    expect(data[1].title).toBe("리팩터링");
    expect(data[1]._count.posts).toBe(2);

    // Verify Prisma was called with correct arguments
    expect(mockPrisma.book.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { finishedAt: "desc" },
    });
  });

  it("빈 목록을 반환한다", async () => {
    mockPrisma.book.findMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockPrisma.book.findMany).toHaveBeenCalled();
  });
});

describe("POST /api/books", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("인증된 사용자가 책을 생성한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.book.findUnique.mockResolvedValue(null); // slug not exists
    mockPrisma.book.create.mockResolvedValue({
      id: "book-1",
      title: "Clean Code",
      author: "Robert Martin",
      slug: "clean-code",
      coverImage: null,
      readAt: null,
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createPostRequest({
      title: "Clean Code",
      author: "Robert Martin",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Clean Code");
    expect(data.slug).toBe("clean-code");
  });

  it("인증되지 않은 사용자는 401을 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const request = createPostRequest({ title: "Test" });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("title 없이 요청 시 400을 받는다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);

    const request = createPostRequest({ author: "Test Author" });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});

// Helper functions for [id] endpoint tests
function createGetByIdRequest(id: string): NextRequest {
  return new NextRequest(new URL(`/api/books/${id}`, "http://localhost:3000"), {
    method: "GET",
  });
}

function createPutRequest(id: string, body: object): NextRequest {
  return new NextRequest(new URL(`/api/books/${id}`, "http://localhost:3000"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createDeleteRequest(id: string): NextRequest {
  return new NextRequest(new URL(`/api/books/${id}`, "http://localhost:3000"), {
    method: "DELETE",
  });
}

describe("GET /api/books/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("책 상세를 성공적으로 조회한다", async () => {
    const mockBook = {
      id: "book-1",
      title: "클린 코드",
      author: "로버트 C. 마틴",
      slug: "clean-code",
      coverImage: "https://example.com/clean-code.jpg",
      readAt: new Date("2024-01-15"),
      summary: "좋은 코드를 작성하는 방법",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      posts: [
        { id: "post-1", title: "Chapter 1" },
        { id: "post-2", title: "Chapter 2" },
      ],
    };

    mockPrisma.book.findUnique.mockResolvedValue(mockBook);

    const { GET: GET_BY_ID } = await import("@/app/api/books/[id]/route");
    const response = await GET_BY_ID(createGetByIdRequest("book-1"), {
      params: Promise.resolve({ id: "book-1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("클린 코드");
    expect(data.posts).toHaveLength(2);
    expect(mockPrisma.book.findUnique).toHaveBeenCalledWith({
      where: { id: "book-1" },
      include: { posts: true },
    });
  });

  it("존재하지 않는 책은 404를 반환한다", async () => {
    mockPrisma.book.findUnique.mockResolvedValue(null);

    const { GET: GET_BY_ID } = await import("@/app/api/books/[id]/route");
    const response = await GET_BY_ID(createGetByIdRequest("nonexistent"), {
      params: Promise.resolve({ id: "nonexistent" }),
    });

    expect(response.status).toBe(404);
  });
});

describe("PUT /api/books/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("인증된 사용자가 책을 수정한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      title: "Old Title",
      author: "Old Author",
      slug: "old-title",
      coverImage: null,
      readAt: null,
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.book.update.mockResolvedValue({
      id: "book-1",
      title: "New Title",
      author: "New Author",
      slug: "old-title", // slug is immutable
      coverImage: "https://example.com/cover.jpg",
      readAt: new Date("2024-01-15"),
      summary: "Updated summary",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { PUT } = await import("@/app/api/books/[id]/route");
    const request = createPutRequest("book-1", {
      title: "New Title",
      author: "New Author",
      coverImage: "https://example.com/cover.jpg",
      readAt: "2024-01-15",
      summary: "Updated summary",
    });
    const response = await PUT(request, { params: Promise.resolve({ id: "book-1" }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("New Title");
    expect(data.author).toBe("New Author");
  });

  it("인증되지 않은 사용자는 401을 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/books/[id]/route");
    const request = createPutRequest("book-1", { title: "Test" });
    const response = await PUT(request, { params: Promise.resolve({ id: "book-1" }) });

    expect(response.status).toBe(401);
  });

  it("존재하지 않는 책은 404를 반환한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.book.findUnique.mockResolvedValue(null);

    const { PUT } = await import("@/app/api/books/[id]/route");
    const request = createPutRequest("nonexistent", { title: "Test" });
    const response = await PUT(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/books/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("인증된 사용자가 책을 삭제한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.book.findUnique.mockResolvedValue({
      id: "book-1",
      title: "Test Book",
      author: "Test Author",
      slug: "test-book",
      coverImage: null,
      readAt: null,
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockPrisma.book.delete.mockResolvedValue({
      id: "book-1",
      title: "Test Book",
      author: "Test Author",
      slug: "test-book",
      coverImage: null,
      readAt: null,
      summary: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const { DELETE } = await import("@/app/api/books/[id]/route");
    const request = createDeleteRequest("book-1");
    const response = await DELETE(request, { params: Promise.resolve({ id: "book-1" }) });

    expect(response.status).toBe(204);
    expect(mockPrisma.book.delete).toHaveBeenCalledWith({
      where: { id: "book-1" },
    });
  });

  it("인증되지 않은 사용자는 401을 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/books/[id]/route");
    const request = createDeleteRequest("book-1");
    const response = await DELETE(request, { params: Promise.resolve({ id: "book-1" }) });

    expect(response.status).toBe(401);
  });

  it("존재하지 않는 책은 404를 반환한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.book.findUnique.mockResolvedValue(null);

    const { DELETE } = await import("@/app/api/books/[id]/route");
    const request = createDeleteRequest("nonexistent");
    const response = await DELETE(request, { params: Promise.resolve({ id: "nonexistent" }) });

    expect(response.status).toBe(404);
  });
});
