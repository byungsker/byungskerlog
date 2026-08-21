import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface PostViewDateRange {
  gte: Date;
  lt: Date;
}

export interface DistinctPostViewCount {
  postId: string;
  count: number;
}

export interface DistinctPostViewStats {
  postId: string;
  totalViews: number;
  dailyViews: number;
}

export interface DistinctPostViewWindowStats {
  totalViews: number;
  dailyViews: number;
  weeklyViews: number;
  monthlyViews: number;
}

export const visitorIdentitySql = Prisma.sql`
  COALESCE(NULLIF("visitorId", ''), NULLIF(TRIM("ipAddress"), ''))
`;

export const validVisitorIdentitySql = Prisma.sql`
  (
    NULLIF("visitorId", '') IS NOT NULL
    OR (NULLIF(TRIM("ipAddress"), '') IS NOT NULL AND TRIM("ipAddress") <> 'unknown')
  )
`;

function toCount(value: bigint | number): number {
  return Number(value);
}

export async function getDistinctPostViewCounts(
  postIds: string[],
  dateRange?: PostViewDateRange
): Promise<DistinctPostViewCount[]> {
  if (postIds.length === 0) {
    return [];
  }

  const dateFilter = dateRange
    ? Prisma.sql`AND "viewedAt" >= ${dateRange.gte} AND "viewedAt" < ${dateRange.lt}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ postId: string; count: bigint | number }>>`
    SELECT "postId", COUNT(DISTINCT ${visitorIdentitySql}) AS "count"
    FROM "PostView"
    WHERE "postId" IN (${Prisma.join(postIds)})
      ${dateFilter}
      AND ${validVisitorIdentitySql}
    GROUP BY "postId"
  `;

  return rows.map((row) => ({ postId: row.postId, count: toCount(row.count) }));
}

export async function getDistinctPostViewStats(
  postIds: string[],
  dailyRange: PostViewDateRange
): Promise<DistinctPostViewStats[]> {
  if (postIds.length === 0) {
    return [];
  }

  const rows = await prisma.$queryRaw<
    Array<{ postId: string; totalViews: bigint | number; dailyViews: bigint | number }>
  >`
    SELECT
      "postId",
      COUNT(DISTINCT ${visitorIdentitySql}) AS "totalViews",
      COUNT(DISTINCT ${visitorIdentitySql}) FILTER (
        WHERE "viewedAt" >= ${dailyRange.gte} AND "viewedAt" < ${dailyRange.lt}
      ) AS "dailyViews"
    FROM "PostView"
    WHERE "postId" IN (${Prisma.join(postIds)})
      AND ${validVisitorIdentitySql}
    GROUP BY "postId"
  `;

  return rows.map((row) => ({
    postId: row.postId,
    totalViews: toCount(row.totalViews),
    dailyViews: toCount(row.dailyViews),
  }));
}

export async function getDistinctPostViewWindowStats(
  postId: string,
  since: { daily: Date; weekly: Date; monthly: Date }
): Promise<DistinctPostViewWindowStats> {
  const rows = await prisma.$queryRaw<
    Array<{
      totalViews: bigint | number;
      dailyViews: bigint | number;
      weeklyViews: bigint | number;
      monthlyViews: bigint | number;
    }>
  >`
    SELECT
      COUNT(DISTINCT ${visitorIdentitySql}) AS "totalViews",
      COUNT(DISTINCT ${visitorIdentitySql}) FILTER (WHERE "viewedAt" >= ${since.daily}) AS "dailyViews",
      COUNT(DISTINCT ${visitorIdentitySql}) FILTER (WHERE "viewedAt" >= ${since.weekly}) AS "weeklyViews",
      COUNT(DISTINCT ${visitorIdentitySql}) FILTER (WHERE "viewedAt" >= ${since.monthly}) AS "monthlyViews"
    FROM "PostView"
    WHERE "postId" = ${postId}
      AND ${validVisitorIdentitySql}
  `;

  const row = rows[0];
  return {
    totalViews: row ? toCount(row.totalViews) : 0,
    dailyViews: row ? toCount(row.dailyViews) : 0,
    weeklyViews: row ? toCount(row.weeklyViews) : 0,
    monthlyViews: row ? toCount(row.monthlyViews) : 0,
  };
}

export async function getDistinctVisitorCounts(dateRange?: PostViewDateRange): Promise<number> {
  const dateFilter = dateRange
    ? Prisma.sql`AND "viewedAt" >= ${dateRange.gte} AND "viewedAt" < ${dateRange.lt}`
    : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(DISTINCT ${visitorIdentitySql}) AS "count"
    FROM "PostView"
    WHERE 1 = 1
      ${dateFilter}
      AND ${validVisitorIdentitySql}
  `;

  return rows[0] ? toCount(rows[0].count) : 0;
}
