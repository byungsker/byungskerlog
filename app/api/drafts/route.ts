import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

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

async function buildDraftTagsPayload(tags: string[]) {
  if (!tags?.length) return undefined;

  const tagOperations = await Promise.all(
    tags.map(async (tagName: string) => {
      const existing = await prisma.tag.findFirst({
        where: { name: { equals: tagName, mode: "insensitive" } },
      });
      if (existing) {
        return { where: { id: existing.id }, create: { name: tagName, slug: generateTagSlug(tagName) } };
      }
      const baseSlug = generateTagSlug(tagName);
      const slugExists = await prisma.tag.findUnique({ where: { slug: baseSlug } });
      const finalSlug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;
      return { where: { name: tagName }, create: { name: tagName, slug: finalSlug } };
    })
  );

  return { connectOrCreate: tagOperations };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const drafts = await prisma.draft.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(drafts);
  } catch (error) {
    return handleApiError(error, "Failed to fetch drafts");
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const { title, content, tags } = body;
    const tagsPayload = await buildDraftTagsPayload(tags);

    const draft = await prisma.draft.create({
      data: {
        title: title || "",
        content: content || "",
        tags: tagsPayload,
        authorId: user.id,
      },
    });

    return NextResponse.json(draft, { status: 201 });
  } catch (error) {
    return handleApiError(error, "Failed to create draft");
  }
}
