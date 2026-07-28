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
});
