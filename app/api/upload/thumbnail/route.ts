import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getAuthUser, isAuthorizedAdmin } from "@/lib/auth";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { API_RATE_LIMITS } from "@/lib/api/security-policy";
import { checkUserRateLimit, rateLimitExceededResponse, setRateLimitHeaders } from "@/lib/rate-limit";
import { UploadPolicyError, createBlobFilename, readUploadPayload } from "@/lib/upload-policy";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return ApiError.unauthorized().toResponse();
  }

  if (!isAuthorizedAdmin(user)) {
    return ApiError.forbidden("Administrator access is required").toResponse();
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
    const blob = await put(createBlobFilename("thumbnail", filename, payload.contentType), payload.bytes, {
      access: "public",
      contentType: payload.contentType,
    });

    const response = NextResponse.json(blob);
    return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
  } catch (error) {
    if (error instanceof UploadPolicyError) {
      const response =
        error.code === "FILE_TOO_LARGE"
          ? ApiError.payloadTooLarge(error.message).toResponse()
          : error.code === "UNSUPPORTED_MEDIA_TYPE"
            ? ApiError.unsupportedMediaType(error.message).toResponse()
            : ApiError.badRequest(error.message).toResponse();
      return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
    }

    const response = handleApiError(error, "Thumbnail upload failed");
    return setRateLimitHeaders(response, rateLimit, API_RATE_LIMITS.upload.limit);
  }
}
