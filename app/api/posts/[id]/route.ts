import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePostListCaches } from "@/lib/post-cache";
import { revalidatePath } from "next/cache";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

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
      select: { slug: true },
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
    revalidatePath(`/posts/${post.slug}`);
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

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(subSlug !== undefined && { subSlug: subSlug || null }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content !== undefined && { content }),
        ...(tags !== undefined && {
          tags: {
            set: [],
            connectOrCreate: tags.map((tagName: string) => ({
              where: { name: tagName },
              create: {
                name: tagName,
                slug:
                  tagName
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9가-힣\s-]/g, "")
                    .replace(/\s+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "") || "tag",
              },
            })),
          },
        }),
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
    revalidatePath(`/posts/${post.slug}`);
    revalidatePostListCaches();

    return NextResponse.json(post);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return ApiError.duplicateEntry("post with this slug").toResponse();
      }
      if (error.code === "P2025") {
        return ApiError.notFound("Post").toResponse();
      }
    }
    return handleApiError(error, "Failed to update post");
  }
}
