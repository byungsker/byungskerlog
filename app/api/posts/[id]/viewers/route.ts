import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { validVisitorIdentitySql, visitorIdentitySql } from "@/lib/analytics/post-view-stats";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

interface ViewSummaryRow {
  uniqueVisitorCount: bigint | number;
  uniqueIpCount: bigint | number;
  viewRecords: bigint | number;
  viewRecordsWithIp: bigint | number;
}

interface ViewIpRow {
  ipAddress: string;
  viewCount: bigint | number;
  firstSeen: Date | string;
  lastSeen: Date | string;
}

function toCount(value: bigint | number): number {
  return Number(value);
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parsePositiveInteger(value: string | null, fallback: number, maximum?: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return maximum ? Math.min(parsed, maximum) : parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }
    if (!isAuthorizedAdmin(user)) {
      throw ApiError.forbidden("Administrator access required");
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parsePositiveInteger(searchParams.get("page"), 1);
    const limit = parsePositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT);
    const skip = (page - 1) * limit;
    const validIpSql = Prisma.sql`
      NULLIF(TRIM("ipAddress"), '') IS NOT NULL
      AND TRIM("ipAddress") <> 'unknown'
    `;

    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!post) {
      throw ApiError.notFound("Post");
    }

    const [summaryRows, ipRows] = await Promise.all([
      prisma.$queryRaw<ViewSummaryRow[]>`
        SELECT
          COUNT(DISTINCT ${visitorIdentitySql}) FILTER (WHERE ${validVisitorIdentitySql})::int AS "uniqueVisitorCount",
          COUNT(DISTINCT TRIM("ipAddress")) FILTER (WHERE ${validIpSql})::int AS "uniqueIpCount",
          COUNT(*)::int AS "viewRecords",
          COUNT(*) FILTER (WHERE ${validIpSql})::int AS "viewRecordsWithIp"
        FROM "PostView"
        WHERE "postId" = ${id}
      `,
      prisma.$queryRaw<ViewIpRow[]>`
        SELECT
          TRIM("ipAddress") AS "ipAddress",
          COUNT(*)::int AS "viewCount",
          MIN("viewedAt") AS "firstSeen",
          MAX("viewedAt") AS "lastSeen"
        FROM "PostView"
        WHERE "postId" = ${id}
          AND ${validIpSql}
        GROUP BY TRIM("ipAddress")
        ORDER BY MAX("viewedAt") DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `,
    ]);

    const summary = summaryRows[0] ?? {
      uniqueVisitorCount: 0,
      uniqueIpCount: 0,
      viewRecords: 0,
      viewRecordsWithIp: 0,
    };
    const uniqueIpCount = toCount(summary.uniqueIpCount);
    const totalPages = Math.max(1, Math.ceil(uniqueIpCount / limit));

    return NextResponse.json({
      post,
      summary: {
        uniqueVisitorCount: toCount(summary.uniqueVisitorCount),
        uniqueIpCount,
        viewRecords: toCount(summary.viewRecords),
        viewRecordsWithIp: toCount(summary.viewRecordsWithIp),
        viewRecordsWithoutIp: Math.max(0, toCount(summary.viewRecords) - toCount(summary.viewRecordsWithIp)),
      },
      ips: ipRows.map((row) => ({
        ipAddress: row.ipAddress,
        viewCount: toCount(row.viewCount),
        firstSeen: toIsoString(row.firstSeen),
        lastSeen: toIsoString(row.lastSeen),
      })),
      pagination: {
        page,
        limit,
        total: uniqueIpCount,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch post viewer IPs");
  }
}
