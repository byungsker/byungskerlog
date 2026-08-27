import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePostListCaches } from "@/lib/post-cache";
import { revalidatePath } from "next/cache";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { buildPostTagsPayload } from "@/lib/server/post-tags";

function getUniqueConstraintTarget(error: object): string {
  if (!("meta" in error) || !error.meta || typeof error.meta !== "object" || !("target" in error.meta)) {
    return "";
  }

  const target = error.meta.target;
  return Array.isArray(target) ? target.join(" ").toLowerCase() : String(target).toLowerCase();
}

function getUniqueConstraintModel(error: object): string {
  if (!("meta" in error) || !error.meta || typeof error.meta !== "object" || !("modelName" in error.meta)) {
    return "";
  }

  return String(error.meta.modelName).toLowerCase();
}

function revalidatePublicPostPaths(slugs: Array<string | null | undefined>): void {
  const validSlugs = new Set(slugs.filter((slug): slug is string => Boolean(slug)));

  for (const slug of validSlugs) {
    revalidatePath(`/posts/${slug}`);
    revalidatePath(`/short/${slug}`);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }
    if (!isAuthorizedAdmin(user)) {
      throw ApiError.forbidden("Administrator access required");
    }

    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { slug: true, subSlug: true },
    });

    if (!post) {
      throw ApiError.notFound("Post");
    }

    await prisma.post.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/short-posts");
    revalidatePath("/tags");
    revalidatePublicPostPaths([post.slug, post.subSlug]);
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    revalidatePostListCaches();

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Failed to delete post");
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      throw ApiError.notFound("Post");
    }
    if (!post.published) {
      const user = await getAuthUser();
      if (!user || !isAuthorizedAdmin(user)) {
        throw ApiError.notFound("Post");
      }
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error, "Failed to fetch post");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }
    if (!isAuthorizedAdmin(user)) {
      throw ApiError.forbidden("Administrator access required");
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      slug,
      subSlug,
      excerpt,
      content,
      tags,
      published,
      thumbnail,
      seriesId,
      type,
      linkedinUrl,
      threadsUrl,
      linkedinContent,
      threadsContent,
    } = body;
    const hasPublicSlugChange = slug !== undefined || subSlug !== undefined;
    const existingPost = hasPublicSlugChange
      ? await prisma.post.findUnique({
          where: { id },
          select: { slug: true, subSlug: true },
        })
      : null;

    const normalizedSlug = typeof slug === "string" ? slug.trim() : slug;
    const normalizedSubSlug = typeof subSlug === "string" ? subSlug.trim() : subSlug;
    const publicUrlCandidates = [normalizedSlug, normalizedSubSlug]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    if (new Set(publicUrlCandidates).size !== publicUrlCandidates.length) {
      throw ApiError.duplicateEntry("post URL", { field: "url" });
    }

    if (publicUrlCandidates.length > 0) {
      const urlConflict = await prisma.post.findFirst({
        where: {
          id: { not: id },
          OR: publicUrlCandidates.flatMap((candidate) => [{ slug: candidate }, { subSlug: candidate }]),
        },
        select: { id: true },
      });

      if (urlConflict) {
        throw ApiError.duplicateEntry("post URL", { field: "url" });
      }
    }

    const tagsPayload = tags !== undefined ? await buildPostTagsPayload(tags, { reset: true }) : undefined;

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug: normalizedSlug }),
        ...(subSlug !== undefined && { subSlug: normalizedSubSlug || null }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(tagsPayload !== undefined && { tags: tagsPayload }),
        ...(type !== undefined && { type }),
        ...(published !== undefined && { published }),
        ...(thumbnail !== undefined && { thumbnail }),
        ...(seriesId !== undefined && { seriesId }),
        ...(linkedinUrl !== undefined && { linkedinUrl: linkedinUrl || null }),
        ...(threadsUrl !== undefined && { threadsUrl: threadsUrl || null }),
        ...(linkedinContent !== undefined && { linkedinContent: linkedinContent || null }),
        ...(threadsContent !== undefined && { threadsContent }),
      },
    });

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/short-posts");
    revalidatePath("/tags");
    revalidatePublicPostPaths([existingPost?.slug, existingPost?.subSlug, post.slug, post.subSlug]);
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    revalidatePostListCaches();

    return NextResponse.json(post);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        const target = getUniqueConstraintTarget(error);
        const model = getUniqueConstraintModel(error);
        const targetFields = target.split(/[^a-z0-9]+/).filter(Boolean);
        const isPostUrlTarget = targetFields.some((field) => field === "slug" || field === "subslug");
        if (isPostUrlTarget && model !== "tag") {
          return ApiError.duplicateEntry("post URL", { field: "url" }).toResponse();
        }
        if (model === "tag" || target.includes("tag")) {
          return ApiError.duplicateEntry("tag", { field: "tag" }).toResponse();
        }
        return ApiError.duplicateEntry("entry", { field: "unknown" }).toResponse();
      }
      if (error.code === "P2025") {
        return ApiError.notFound("Post").toResponse();
      }
    }
    return handleApiError(error, "Failed to update post");
  }
}
