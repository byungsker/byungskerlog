import { describe, expect, it, vi } from "vitest";
import type { NormalizedLinkedInShortImportRecord } from "@/lib/linkedin-short-import";
import { importLinkedInShorts, type LinkedInImportPrisma } from "@/lib/server/linkedin-short-persistence";

function createRecord(url: string | null, title = "LinkedIn 글"): NormalizedLinkedInShortImportRecord {
  return {
    title,
    content: "본문 내용",
    publishedAt: new Date("2026-08-10T00:00:00.000Z"),
    url,
  };
}

function createPrismaMock(): LinkedInImportPrisma {
  return {
    post: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
  } as unknown as LinkedInImportPrisma;
}

describe("LinkedIn SHORT 영속화", () => {
  it("기존 글은 갱신하고 URL이 없는 레코드는 건너뛴다", async () => {
    const prisma = createPrismaMock();
    vi.mocked(prisma.post.findFirst).mockResolvedValue({ id: "existing" } as never);

    const summary = await importLinkedInShorts(
      [createRecord("https://www.linkedin.com/posts/existing"), createRecord(null)],
      prisma
    );

    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: "existing" },
      data: expect.objectContaining({ type: "SHORT", published: true }),
    });
    expect(summary).toEqual({ imported: 1, skipped: 1, created: 0, updated: 1 });
  });

  it("새 글은 slug 충돌을 피해서 생성하고 생성 카운트를 보고한다", async () => {
    const prisma = createPrismaMock();
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.post.findUnique)
      .mockResolvedValueOnce({ id: "collision" } as never)
      .mockResolvedValueOnce(null);

    const summary = await importLinkedInShorts([createRecord("https://www.linkedin.com/posts/new", "새 글")], prisma);

    expect(prisma.post.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ slug: "새-글-2", linkedinUrl: "https://www.linkedin.com/posts/new" }),
    });
    expect(summary).toEqual({ imported: 1, skipped: 0, created: 1, updated: 0 });
  });

  it("생성 직전 slug 충돌이 발생해도 다음 slug로 재시도한다", async () => {
    const prisma = createPrismaMock();
    vi.mocked(prisma.post.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.post.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.post.create)
      .mockRejectedValueOnce({ code: "P2002", meta: { target: ["slug"] } } as never)
      .mockResolvedValueOnce({} as never);

    const summary = await importLinkedInShorts(
      [createRecord("https://www.linkedin.com/posts/race", "경쟁 글")],
      prisma
    );

    expect(prisma.post.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({ slug: "경쟁-글-2" }),
    });
    expect(summary).toEqual({ imported: 1, skipped: 0, created: 1, updated: 0 });
  });
});
