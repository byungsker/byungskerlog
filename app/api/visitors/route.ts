import { NextResponse } from "next/server";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { getUtcDateOnly, parseAnalyticsDateRange } from "@/lib/analytics/date-range";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { getDistinctVisitorCounts } from "@/lib/analytics/post-view-stats";
import { API_RATE_LIMITS } from "@/lib/api/security-policy";
import { checkUserRateLimit, rateLimitExceededResponse, setRateLimitHeaders } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    if (!isAuthorizedAdmin(user)) {
      throw ApiError.forbidden("Administrator access is required");
    }

    const rateLimit = checkUserRateLimit(user.id, "analytics:visitors", API_RATE_LIMITS.visitors.limit);
    if (!rateLimit.allowed) {
      return rateLimitExceededResponse(rateLimit, API_RATE_LIMITS.visitors.limit);
    }

    const today = getUtcDateOnly();
    const { gte: startOfToday, lt: startOfTomorrow } = parseAnalyticsDateRange(today, today);

    const [uniqueToday, uniqueTotal] = await Promise.all([
      getDistinctVisitorCounts({ gte: startOfToday, lt: startOfTomorrow }),
      getDistinctVisitorCounts(),
    ]);

    const response = NextResponse.json(
      {
        today: uniqueToday,
        total: uniqueTotal,
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
    setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.visitors.limit);
    return response;
  } catch (error) {
    return handleApiError(error, "Failed to fetch visitor stats");
  }
}
