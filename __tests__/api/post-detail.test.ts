import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
  isAuthorizedAdmin: vi.fn(() => true),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

import { PATCH } from "@/app/api/posts/[id]/route";
import { getAuthUser } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);

function createPatchRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/posts/post-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const routeParams = { params: Promise.resolve({ id: "post-1" }) };

describe("PATCH /api/posts/[id]", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
  });

  it("현재 post id를 제외하고 동일 Main Slug 수정을 허용한다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);
    mockPrisma.tag.findFirst.mockResolvedValue({ id: "tag-1", name: "TanStack", slug: "tanstack" });
    mockPrisma.post.update.mockResolvedValue({
      id: "post-1",
      slug: "vue-query-type-regression",
      subSlug: null,
      title: "수정된 글",
    });

    const response = await PATCH(
      createPatchRequest({
        title: "수정된 글",
        slug: "vue-query-type-regression",
        subSlug: null,
        tags: ["tanstack"],
      }),
      routeParams
    );

    expect(response.status).toBe(200);
    expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
      where: {
        id: { not: "post-1" },
        OR: [{ slug: "vue-query-type-regression" }, { subSlug: "vue-query-type-regression" }],
      },
      select: { id: true },
    });
    expect(mockPrisma.post.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tags: {
            set: [],
            connectOrCreate: [
              {
                where: { id: "tag-1" },
                create: { name: "tanstack", slug: "tanstack" },
              },
            ],
          },
        }),
      })
    );
  });

  it("다른 포스트의 Sub Slug와 겹치는 Main Slug 변경을 차단한다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue({ id: "post-2" });

    const response = await PATCH(createPatchRequest({ slug: "existing-public-url" }), routeParams);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe("DUPLICATE_ENTRY");
    expect(data.details).toEqual({ field: "url" });
    expect(mockPrisma.post.update).not.toHaveBeenCalled();
  });

  it("태그 고유 제약 오류를 URL 중복으로 오인하지 않는다", async () => {
    mockPrisma.post.findFirst.mockResolvedValue(null);
    mockPrisma.post.update.mockRejectedValue({ code: "P2002", meta: { modelName: "Tag", target: ["slug"] } });

    const response = await PATCH(createPatchRequest({ title: "수정된 글" }), routeParams);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe("DUPLICATE_ENTRY");
    expect(data.details).toEqual({ field: "tag" });
    expect(data.error).not.toContain("post with this slug");
  });

  it.each([["linkedShortPostId"], ["futureUniqueField"]])(
    "Post의 URL 외 고유 제약 %s 오류를 URL 중복으로 오인하지 않는다",
    async (target) => {
      mockPrisma.post.update.mockRejectedValue({ code: "P2002", meta: { modelName: "Post", target: [target] } });

      const response = await PATCH(createPatchRequest({ title: "수정된 글" }), routeParams);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.code).toBe("DUPLICATE_ENTRY");
      expect(data.details).toEqual({ field: "unknown" });
      expect(data.error).not.toContain("post URL");
    }
  );
});
