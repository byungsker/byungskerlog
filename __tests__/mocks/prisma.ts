import { vi } from "vitest";

export const mockPrisma = {
  $queryRaw: vi.fn(),
  post: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  comment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  draft: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  series: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  tag: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  book: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  postView: {
    findMany: vi.fn(),
    create: vi.fn(),
    count: vi.fn(),
  },
  readingSession: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
    groupBy: vi.fn(),
  },
};

export function resetPrismaMocks() {
  mockPrisma.$queryRaw.mockReset();
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === "function") return;
    Object.values(model).forEach((method) => {
      if (typeof method === "function" && "mockReset" in method) {
        (method as ReturnType<typeof vi.fn>).mockReset();
      }
    });
  });
}

export function createPrismaMock() {
  return {
    prisma: mockPrisma,
  };
}
