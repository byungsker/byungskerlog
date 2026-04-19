import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuthUser } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";

async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        OR: [{ slug }, { subSlug: slug }],
      },
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
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

async function buildTagsPayload(tags: string[]) {
  if (!tags?.length) return undefined;

  const tagOperations = await Promise.all(
    tags.map(async (tagName: string) => {
      // case-insensitive 검색으로 기존 태그 찾기
      const existing = await prisma.tag.findFirst({
        where: { name: { equals: tagName, mode: "insensitive" } },
      });
      if (existing) {
        return { where: { id: existing.id }, create: { name: tagName, slug: generateTagSlug(tagName) } };
      }
      // 슬러그 충돌 방지: 슬러그가 이미 있으면 타임스탬프 붙이기
      const baseSlug = generateTagSlug(tagName);
      const slugExists = await prisma.tag.findUnique({ where: { slug: baseSlug } });
      const finalSlug = slugExists ? `${baseSlug}-${Date.now()}` : baseSlug;
      return { where: { name: tagName }, create: { name: tagName, slug: finalSlug } };
    })
  );

  return { connectOrCreate: tagOperations };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const body = await request.json();
    const {
      title,
      slug: requestedSlug,
      excerpt,
      content,
      tags,
      published,
      thumbnail,
      seriesId,
      type,
      linkedinContent,
      threadsContent,
      createShortPost,
      shortPostContent,
      shortPostSlug,
    } = body;

    if (!title || !requestedSlug || !content) {
      throw ApiError.validationError("Missing required fields", {
        required: ["title", "slug", "content"],
      });
    }

    const slug = await generateUniqueSlug(requestedSlug);
    const tagsPayload = await buildTagsPayload(tags);

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        content,
        tags: tagsPayload,
        type: type || "LONG",
        published: published ?? false,
        thumbnail: thumbnail || null,
        series: seriesId ? { connect: { id: seriesId } } : undefined,
        linkedinContent: linkedinContent || null,
        threadsContent: threadsContent || [],
      },
    });

    if (type === "LONG" && createShortPost && shortPostContent) {
      const shortSlug = await generateUniqueSlug(shortPostSlug || `${slug}-short`);
      const shortExcerpt = shortPostContent
        .replace(/[#*`\[\]()>\-]/g, "")
        .replace(/\n+/g, " ")
        .trim()
        .substring(0, 200);

      const shortPost = await prisma.post.create({
        data: {
          title,
          slug: shortSlug,
          excerpt: shortExcerpt || null,
          content: shortPostContent,
          tags: tagsPayload,
          type: "SHORT",
          published: true,
          thumbnail: thumbnail || null,
          series: seriesId ? { connect: { id: seriesId } } : undefined,
          linkedinContent: linkedinContent || null,
          threadsContent: threadsContent || [],
        },
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { linkedShortPostId: shortPost.id },
      });

      revalidatePath(`/short-posts/${shortSlug}`);
    }

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath("/short-posts");
    revalidatePath("/tags");
    revalidatePath(`/posts/${slug}`);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      const meta = (error as { meta?: { target?: string[] } }).meta;
      const target = meta?.target?.join(", ") || "unknown field";
      return ApiError.duplicateEntry(`entry (${target})`).toResponse();
    }
    return handleApiError(error, "Failed to create post");
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const tag = searchParams.get("tag");
    const includeUnpublished = searchParams.get("includeUnpublished") === "true";
    const sortBy = searchParams.get("sortBy") || "desc";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    type WhereClause = {
      published?: boolean;
      tags?: { some: { name: string } };
      type?: "LONG" | "SHORT";
      createdAt?: {
        gte?: Date;
        lt?: Date;
      };
      OR?: Array<{
        title?: { contains: string; mode: "insensitive" };
        tags?: { some: { name: string } };
        series?: { name: { contains: string; mode: "insensitive" } };
        createdAt?: { gte: Date; lt: Date };
      }>;
    };

    const where: WhereClause = {};

    if (!includeUnpublished) {
      where.published = true;
    }

    if (tag) {
      where.tags = { some: { name: tag } };
    }

    if (type && (type === "LONG" || type === "SHORT")) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        where.createdAt.lt = end;
      }
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      const orConditions: WhereClause["OR"] = [
        { title: { contains: searchTerm, mode: "insensitive" } },
        { tags: { some: { name: searchTerm } } },
        { series: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];

      const datePattern = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
      if (datePattern.test(searchTerm)) {
        const searchDate = new Date(searchTerm.replace(/\//g, "-"));
        if (!isNaN(searchDate.getTime())) {
          const nextDay = new Date(searchDate);
          nextDay.setDate(nextDay.getDate() + 1);
          orConditions.push({
            createdAt: { gte: searchDate, lt: nextDay },
          });
        }
      }

      where.OR = orConditions;
    }

    const total = await prisma.post.count({ where });

    const postsRaw = await prisma.post.findMany({
      where,
      orderBy: { createdAt: sortBy === "asc" ? "asc" : "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        subSlug: true,
        title: true,
        excerpt: true,
        content: true,
        thumbnail: true,
        tags: {
          select: { name: true },
        },
        type: true,
        published: true,
        createdAt: true,
        updatedAt: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const posts = postsRaw.map((post) => ({
      ...post,
      tags: post.tags.map((t) => t.name),
    }));

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const postIds = posts.map((post) => post.id);

    const allViews =
      postIds.length > 0
        ? await prisma.postView.findMany({
            where: { postId: { in: postIds } },
            select: {
              postId: true,
              viewedAt: true,
            },
          })
        : [];

    const viewStats = allViews.reduce(
      (acc, view) => {
        if (!acc[view.postId]) {
          acc[view.postId] = { totalViews: 0, dailyViews: 0 };
        }
        acc[view.postId].totalViews++;
        if (view.viewedAt >= oneDayAgo) {
          acc[view.postId].dailyViews++;
        }
        return acc;
      },
      {} as Record<string, { totalViews: number; dailyViews: number }>
    );

    const longPostIds = posts.filter((p) => p.type === "LONG").map((p) => p.id);
    let readingStats: Record<string, { sessions: number; totalDepth: number; completed: number }> = {};

    try {
      const readingSessions =
        longPostIds.length > 0
          ? await prisma.readingSession.findMany({
              where: { postId: { in: longPostIds } },
              select: {
                postId: true,
                maxScrollDepth: true,
                completed: true,
              },
            })
          : [];

      readingStats = readingSessions.reduce(
        (acc, session) => {
          if (!acc[session.postId]) {
            acc[session.postId] = { sessions: 0, totalDepth: 0, completed: 0 };
          }
          acc[session.postId].sessions++;
          acc[session.postId].totalDepth += session.maxScrollDepth;
          if (session.completed) {
            acc[session.postId].completed++;
          }
          return acc;
        },
        {} as Record<string, { sessions: number; totalDepth: number; completed: number }>
      );
    } catch (readingError) {
      console.error("Error fetching reading sessions:", readingError);
    }

    const postsWithViews = posts.map((post) => {
      const reading = readingStats[post.id];
      const avgScrollDepth = reading ? Math.round(reading.totalDepth / reading.sessions) : null;
      const completionRate = reading ? Math.round((reading.completed / reading.sessions) * 100) : null;

      return {
        ...post,
        totalViews: viewStats[post.id]?.totalViews || 0,
        dailyViews: viewStats[post.id]?.dailyViews || 0,
        readingSessions: reading?.sessions || null,
        avgScrollDepth,
        completionRate,
      };
    });

    const sortedPosts =
      sortBy === "popular" ? postsWithViews.sort((a, b) => b.totalViews - a.totalViews) : postsWithViews;

    return NextResponse.json({
      posts: sortedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch posts");
  }
}
