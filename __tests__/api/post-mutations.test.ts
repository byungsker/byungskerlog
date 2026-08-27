import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

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

import { DELETE, PATCH } from "@/app/api/posts/[id]/route";
import { POST as bulkPost } from "@/app/api/posts/bulk/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);
const mockRevalidatePath = vi.mocked(revalidatePath);
const params = { params: Promise.resolve({ id: "post-1" }) };

function nonAdminUser() {
  return {
    id: "reader-1",
    primaryEmail: "reader@example.com",
  } as Awaited<ReturnType<typeof getAuthUser>>;
}

describe("게시글 변경 권한", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockRevalidatePath.mockReset();
    mockGetAuthUser.mockResolvedValue(nonAdminUser());
    mockIsAuthorizedAdmin.mockReturnValue(false);
  });

  it("관리자가 아닌 사용자의 PATCH를 거부한다", async () => {
    const response = await PATCH(
      new NextRequest("http://localhost/api/posts/post-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "변조" }),
      }),
      params
    );

    expect(response.status).toBe(403);
    expect(mockPrisma.post.update).not.toHaveBeenCalled();
  });

  it("관리자가 아닌 사용자의 DELETE를 거부한다", async () => {
    const response = await DELETE(
      new NextRequest("http://localhost/api/posts/post-1", {
        method: "DELETE",
      }),
      params
    );

    expect(response.status).toBe(403);
    expect(mockPrisma.post.delete).not.toHaveBeenCalled();
  });

  it("관리자가 아닌 사용자의 bulk 변경을 거부한다", async () => {
    const response = await bulkPost(
      new NextRequest("http://localhost/api/posts/bulk", {
        method: "POST",
        body: JSON.stringify({ action: "publish", postIds: ["post-1"] }),
      })
    );

    expect(response.status).toBe(403);
  });

  it("관리자 게시글 수정 후 sitemap과 RSS 캐시를 무효화한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "admin-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "updated-post",
      title: "수정된 글",
      content: "내용",
      published: true,
    });

    const response = await PATCH(
      new NextRequest("http://localhost/api/posts/post-1", {
        method: "PATCH",
        body: JSON.stringify({ title: "수정된 글" }),
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed.xml");
  });

  it("관리자 일괄 공개 후 sitemap과 RSS 캐시를 무효화한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "admin-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.updateMany.mockResolvedValue({ count: 2 });

    const response = await bulkPost(
      new NextRequest("http://localhost/api/posts/bulk", {
        method: "POST",
        body: JSON.stringify({ action: "publish", postIds: ["post-1", "post-2"] }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed.xml");
  });
});
