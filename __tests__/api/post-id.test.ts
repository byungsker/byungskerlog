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

  it("일반 PATCH의 sub-slug 수정 후 이전·새 공개 경로를 모두 무효화한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.findUnique.mockResolvedValue({ slug: "canonical-post", subSlug: "old-alias" });
    mockPrisma.post.findFirst.mockResolvedValue(null);
    mockPrisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "canonical-post",
      subSlug: "new-alias",
      title: "수정된 글",
    });

    const response = await PATCH(createPatchRequest({ subSlug: "new-alias" }), {
      params: Promise.resolve({ id: "post-1" }),
    });

    expect(response.status).toBe(200);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/posts/canonical-post");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/posts/old-alias");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/posts/new-alias");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/short/canonical-post");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/short/old-alias");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/short/new-alias");
  });
});
