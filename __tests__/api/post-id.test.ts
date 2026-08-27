import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { PATCH } from "@/app/api/posts/[id]/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);
const mockRevalidatePath = vi.mocked(revalidatePath);

function createPatchRequest(body: object): NextRequest {
  return new NextRequest(new URL("/api/posts/post-1", "http://localhost:3000"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/posts/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("게시글 수정 후 sitemap과 RSS 캐시를 무효화한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "updated-post",
      title: "수정된 글",
      content: "내용",
      published: true,
    });

    const response = await PATCH(createPatchRequest({ title: "수정된 글" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed.xml");
  });
});
