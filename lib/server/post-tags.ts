import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

interface BuildPostTagsOptions {
  reset?: boolean;
}

function generateTagSlug(tagName: string): string {
  return (
    tagName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `tag-${Date.now()}`
  );
}

export function buildPostTagsPayload(
  tags: string[] | undefined
): Promise<Prisma.TagCreateNestedManyWithoutPostsInput | undefined>;
export function buildPostTagsPayload(
  tags: string[] | undefined,
  options: { reset: true }
): Promise<Prisma.TagUpdateManyWithoutPostsNestedInput>;
export async function buildPostTagsPayload(
  tags: string[] | undefined,
  options: BuildPostTagsOptions = {}
): Promise<Prisma.TagCreateNestedManyWithoutPostsInput | Prisma.TagUpdateManyWithoutPostsNestedInput | undefined> {
  if (!tags?.length) {
    return options.reset ? { set: [] } : undefined;
  }

  const uniqueTags = Array.from(
    new Map(tags.map((tagName) => [tagName.toLowerCase().trim(), tagName.trim()])).values()
  );

  const connectOrCreate = await Promise.all(
    uniqueTags.map(async (tagName) => {
      const existing = await prisma.tag.findFirst({
        where: { name: { equals: tagName, mode: "insensitive" } },
      });

      if (existing) {
        return {
          where: { id: existing.id },
          create: { name: tagName, slug: generateTagSlug(tagName) },
        };
      }

      const baseSlug = generateTagSlug(tagName);
      const slugExists = await prisma.tag.findUnique({ where: { slug: baseSlug } });
      const slug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;

      return {
        where: { name: tagName },
        create: { name: tagName, slug },
      };
    })
  );

  return {
    ...(options.reset && { set: [] }),
    connectOrCreate,
  };
}
