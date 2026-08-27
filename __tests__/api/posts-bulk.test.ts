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

import { POST } from "@/app/api/posts/bulk/route";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);
const mockIsAuthorizedAdmin = vi.mocked(isAuthorizedAdmin);
const mockRevalidatePath = vi.mocked(revalidatePath);

describe("POST /api/posts/bulk", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
    mockIsAuthorizedAdmin.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("일괄 공개 후 sitemap과 RSS 캐시를 무효화한다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockIsAuthorizedAdmin.mockReturnValue(true);
    mockPrisma.post.updateMany.mockResolvedValue({ count: 2 });

    const request = new NextRequest(new URL("/api/posts/bulk", "http://localhost:3000"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", postIds: ["post-1", "post-2"] }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/sitemap.xml");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/feed.xml");
  });
});
