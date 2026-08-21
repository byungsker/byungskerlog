import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { API_RATE_LIMITS } from "@/lib/api/security-policy";
import { checkUserRateLimit, rateLimitExceededResponse, setRateLimitHeaders } from "@/lib/rate-limit";
import { UploadPolicyError, createBlobFilename, readUploadPayload } from "@/lib/upload-policy";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!isAuthorizedAdmin(user)) {
    return NextResponse.json({ error: "Administrator access is required", code: "FORBIDDEN" }, { status: 403 });
  }

  const rateLimit = checkUserRateLimit(user.id, "upload", API_RATE_LIMITS.upload.limit);
  if (!rateLimit.allowed) {
    return rateLimitExceededResponse(rateLimit, API_RATE_LIMITS.upload.limit);
  }

  const filename = new URL(request.url).searchParams.get("filename");
  if (!filename) {
    const response = NextResponse.json({ error: "Filename is required", code: "BAD_REQUEST" }, { status: 400 });
    return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
  }

  try {
    const payload = await readUploadPayload(request);
    const blob = await put(createBlobFilename("upload", filename, payload.contentType), payload.bytes, {
      access: "public",
      contentType: payload.contentType,
    });

    const response = NextResponse.json(blob);
    return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
  } catch (error) {
    if (error instanceof UploadPolicyError) {
      const response = NextResponse.json({ error: error.message, code: error.code }, { status: error.statusCode });
      return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
    }

    console.error("Upload error:", error);
    const response = NextResponse.json({ error: "Upload failed", code: "INTERNAL_ERROR" }, { status: 500 });
    return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
  }
}
