import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { API_RATE_LIMITS } from "@/lib/api/security-policy";
import { checkRequestRateLimit, rateLimitExceededResponse, setRateLimitHeaders } from "@/lib/rate-limit";

interface ReadingSessionBody {
  sessionId: string;
  maxScrollDepth: number;
  readingTime: number;
  completed: boolean;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const rateLimit = checkRequestRateLimit(request, "analytics:reading-session", API_RATE_LIMITS.readingSession.limit);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit, API_RATE_LIMITS.readingSession.limit);
  }

  try {
    const { slug } = await params;
    const body: ReadingSessionBody = await request.json();

    const { sessionId, maxScrollDepth, readingTime, completed } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: {
        OR: [{ slug }, { subSlug: slug }],
        type: "LONG",
      },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const normalizedDepth = Math.min(100, Math.max(0, maxScrollDepth));
    const normalizedTime = Math.max(0, readingTime);

    const existing = await prisma.readingSession.findUnique({
      where: {
        postId_sessionId: {
          postId: post.id,
          sessionId,
        },
      },
    });

    if (existing) {
      await prisma.readingSession.update({
        where: {
          postId_sessionId: {
            postId: post.id,
            sessionId,
          },
        },
        data: {
          maxScrollDepth: Math.max(existing.maxScrollDepth, normalizedDepth),
          readingTime: existing.readingTime + normalizedTime,
          completed: existing.completed || completed,
        },
      });
    } else {
      await prisma.readingSession.create({
        data: {
          postId: post.id,
          sessionId,
          maxScrollDepth: normalizedDepth,
          readingTime: normalizedTime,
          completed,
        },
      });
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.readingSession.limit);
    return response;
  } catch (error) {
    console.error("Error recording reading session:", error);
    return NextResponse.json({ error: "Failed to record reading session" }, { status: 500 });
  }
}
