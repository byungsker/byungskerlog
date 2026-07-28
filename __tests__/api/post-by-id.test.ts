import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { GET } from "@/app/api/posts/[id]/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);
const params = { params: Promise.resolve({ id: "post-1" }) };

describe("GET /api/posts/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
  });

  it("공개 게시글은 비로그인 사용자에게 반환한다", async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      title: "공개 글",
      published: true,
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/api/posts/post-1"),
      params
    );

    expect(response.status).toBe(200);
  });

  it("비공개 게시글은 비로그인 사용자에게 노출하지 않는다", async () => {
    mockPrisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      title: "초안",
      published: false,
    });
    mockGetAuthUser.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/posts/post-1"),
      params
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("NOT_FOUND");
  });

  it("관리자는 비공개 게시글을 조회할 수 있다", async () => {
    const admin = {
      id: "admin-1",
      primaryEmail: "admin@byungskerlog.com",
    } as Awaited<ReturnType<typeof getAuthUser>>;
    mockPrisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      title: "초안",
      published: false,
    });
    mockGetAuthUser.mockResolvedValue(admin);
    mockIsAuthorizedAdmin.mockReturnValue(true);

    const response = await GET(
      new NextRequest("http://localhost:3000/api/posts/post-1"),
      params
    );

    expect(response.status).toBe(200);
  });
});
