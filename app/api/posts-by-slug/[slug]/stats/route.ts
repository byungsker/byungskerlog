import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDistinctPostViewWindowStats } from "@/lib/analytics/post-view-stats";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Find post by slug
    const post = await prisma.post.findFirst({
      where: { slug, published: true },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { totalViews, dailyViews, weeklyViews, monthlyViews } = await getDistinctPostViewWindowStats(post.id, {
      daily: oneDayAgo,
      weekly: oneWeekAgo,
      monthly: oneMonthAgo,
    });

    return NextResponse.json({
      total: totalViews,
      daily: dailyViews,
      weekly: weeklyViews,
      monthly: monthlyViews,
    });
  } catch (error) {
    console.error("Error fetching view stats:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
