import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { parseAnalyticsDateRange, type AnalyticsDateRange } from "@/lib/analytics/date-range";
import { getDistinctPostViewCounts } from "@/lib/analytics/post-view-stats";

type StatType = "category" | "views" | "count" | "reading";
type PostType = "LONG" | "SHORT";

const STAT_TYPES: StatType[] = ["category", "views", "count", "reading"];
const POST_TYPES: Array<"all" | PostType> = ["all", "LONG", "SHORT"];

interface PostWhereClause {
  published: true;
  type?: PostType;
}

function isStatType(value: string | null): value is StatType {
  return value !== null && STAT_TYPES.includes(value as StatType);
}

function getPostType(value: string | null): PostType | undefined {
  if (!value || value === "all") return undefined;
  if (!POST_TYPES.includes(value as "all" | PostType)) {
    throw ApiError.validationError("Invalid type. Must be 'all', 'LONG', or 'SHORT'");
  }
  return value as PostType;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    if (!isAuthorizedAdmin(user)) {
      throw ApiError.forbidden("Administrator access is required");
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const statType = searchParams.get("statType");

    if (!isStatType(statType)) {
      throw ApiError.validationError("Invalid statType. Must be 'category', 'views', 'count', or 'reading'");
    }

    let dateRange: AnalyticsDateRange;
    try {
      dateRange = parseAnalyticsDateRange(startDate, endDate);
    } catch (error) {
      throw ApiError.validationError(error instanceof Error ? error.message : "Invalid date range");
    }

    const postType = getPostType(type);
    const postWhere: PostWhereClause = { published: true, ...(postType ? { type: postType } : {}) };

    let data;

    switch (statType) {
      case "category":
        data = await getCategoryStats({ ...postWhere, createdAt: dateRange });
        break;
      case "views":
        data = await getViewsStats(postWhere, dateRange);
        break;
      case "count":
        data = await getCountStats({ ...postWhere, createdAt: dateRange });
        break;
      case "reading":
        data = await getReadingStats(postWhere, dateRange);
        break;
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, "Failed to fetch analytics");
  }
}

async function getCategoryStats(where: {
  published: true;
  type?: PostType;
  createdAt: AnalyticsDateRange;
}) {
  const posts = await prisma.post.findMany({
    where,
    select: {
      tags: {
        select: { name: true },
      },
    },
  });

  const tagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
    });
  });

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

async function getViewsStats(where: {
  published: true;
  type?: PostType;
}, dateRange: AnalyticsDateRange) {
  const posts = await prisma.post.findMany({
    where,
    select: { id: true, title: true, slug: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return [];
  }

  const views = await getDistinctPostViewCounts(postIds, dateRange);

  const viewMap = new Map(views.map((v) => [v.postId, v.count]));

  return posts
    .map((post) => ({
      title: post.title.length > 30 ? post.title.slice(0, 30) + "..." : post.title,
      slug: post.slug,
      views: viewMap.get(post.id) || 0,
    }))
    .filter((post) => post.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}

async function getCountStats(where: {
  published: true;
  type?: PostType;
  createdAt: AnalyticsDateRange;
}) {
  const posts = await prisma.post.findMany({
    where,
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const dateCounts: Record<string, number> = {};
  posts.forEach((post) => {
    const dateKey = post.createdAt.toISOString().split("T")[0];
    dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
  });

  return Object.entries(dateCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getReadingStats(where: {
  published: true;
  type?: PostType;
}, dateRange: AnalyticsDateRange) {
  if (where.type === "SHORT") {
    return [];
  }

  const longWhere = { ...where, type: "LONG" as const };

  const posts = await prisma.post.findMany({
    where: longWhere,
    select: { id: true, title: true, slug: true },
  });

  const postIds = posts.map((p) => p.id);

  if (postIds.length === 0) {
    return [];
  }

  const sessions = await prisma.readingSession.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds }, createdAt: dateRange },
    _count: { id: true },
    _avg: { maxScrollDepth: true },
  });

  const completedCounts = await prisma.readingSession.groupBy({
    by: ["postId"],
    where: {
      postId: { in: postIds },
      completed: true,
      createdAt: dateRange,
    },
    _count: { id: true },
  });

  const sessionMap = new Map<string, { total: number; avgDepth: number }>(
    sessions.map((s) => [s.postId, { total: s._count.id, avgDepth: s._avg.maxScrollDepth || 0 }])
  );

  const completedMap = new Map<string, number>(completedCounts.map((c) => [c.postId, c._count.id]));

  return posts
    .map((post) => {
      const stats = sessionMap.get(post.id) || { total: 0, avgDepth: 0 };
      const completed = completedMap.get(post.id) || 0;
      const completionRate = stats.total > 0 ? (completed / stats.total) * 100 : 0;

      return {
        title: post.title.length > 25 ? post.title.slice(0, 25) + "..." : post.title,
        slug: post.slug,
        sessions: stats.total,
        avgDepth: Math.round(stats.avgDepth),
        completionRate: Math.round(completionRate),
      };
    })
    .filter((p) => p.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);
}
