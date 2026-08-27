import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { revalidatePostListCaches } from "@/lib/post-cache";

const SUB_SLUG_REGEX = /^[a-z0-9-]+$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { subSlug } = body;

    if (!subSlug || typeof subSlug !== "string") {
      return NextResponse.json(
        { error: "subSlug is required" },
        { status: 400 }
      );
    }

    const trimmedSubSlug = subSlug.trim().toLowerCase();

    if (!SUB_SLUG_REGEX.test(trimmedSubSlug)) {
      return NextResponse.json(
        { error: "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다." },
        { status: 400 }
      );
    }

    if (trimmedSubSlug.startsWith("-") || trimmedSubSlug.endsWith("-")) {
      return NextResponse.json(
        { error: "하이픈으로 시작하거나 끝날 수 없습니다." },
        { status: 400 }
      );
    }

    if (trimmedSubSlug.includes("--")) {
      return NextResponse.json(
        { error: "연속된 하이픈은 사용할 수 없습니다." },
        { status: 400 }
      );
    }

    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { slug: true, subSlug: true },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const conflicting = await prisma.post.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [{ slug: trimmedSubSlug }, { subSlug: trimmedSubSlug }],
          },
        ],
      },
    });

    if (conflicting) {
      return NextResponse.json(
        { error: "이미 사용 중인 URL입니다." },
        { status: 409 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { subSlug: trimmedSubSlug },
    });

    revalidatePath("/");
    revalidatePath("/posts");
    for (const slug of new Set([existingPost.slug, existingPost.subSlug, trimmedSubSlug].filter(Boolean))) {
      revalidatePath(`/posts/${slug}`);
      revalidatePath(`/short/${slug}`);
    }
    revalidatePath("/sitemap.xml");
    revalidatePath("/feed.xml");
    revalidatePostListCaches();

    return NextResponse.json({
      subSlug: updatedPost.subSlug,
      message: "Sub slug updated successfully",
    });
  } catch (error) {
    console.error("Error updating sub slug:", error);
    return NextResponse.json(
      { error: "Failed to update sub slug" },
      { status: 500 }
    );
  }
}
