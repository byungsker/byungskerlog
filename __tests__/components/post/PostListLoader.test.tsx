import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../../mocks/prisma";

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("next/cache", () => ({
  unstable_cache: (callback: () => unknown) => callback,
}));
vi.mock("@/components/post/PostListClient", () => ({
  PostListClient: () => null,
}));

import { PostListLoader } from "@/components/post/PostListLoader";

describe("PostListLoader", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("DB 오류를 빈 목록으로 변환하지 않고 error boundary로 전달한다", async () => {
    mockPrisma.post.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(PostListLoader()).rejects.toThrow("database unavailable");
  });
});
