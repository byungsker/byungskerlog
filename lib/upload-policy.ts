import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"] as const;

type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const MIME_EXTENSIONS: Record<AllowedImageMimeType, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

type UploadPolicyErrorCode = "FILE_TOO_LARGE" | "NO_FILE" | "UNSUPPORTED_MEDIA_TYPE";

export class UploadPolicyError extends Error {
  constructor(
    public readonly code: UploadPolicyErrorCode,
    public readonly statusCode: 400 | 413 | 415,
    message: string
  ) {
    super(message);
    this.name = "UploadPolicyError";
  }
}

export interface UploadPayload {
  bytes: Buffer;
  contentType: AllowedImageMimeType;
}

function normalizeContentType(value: string | null): string {
  return value?.split(";", 1)[0].trim().toLowerCase() || "";
}

function hasImageSignature(contentType: AllowedImageMimeType, bytes: Uint8Array): boolean {
  switch (contentType) {
    case "image/jpeg":
      return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/png":
      return (
        bytes.length >= 8 &&
        bytes[0] === 0x89 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x4e &&
        bytes[3] === 0x47 &&
        bytes[4] === 0x0d &&
        bytes[5] === 0x0a &&
        bytes[6] === 0x1a &&
        bytes[7] === 0x0a
      );
    case "image/gif":
      return (
        bytes.length >= 6 &&
        ((bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && bytes[4] === 0x37) ||
          (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 && bytes[4] === 0x39)) &&
        bytes[5] === 0x61
      );
    case "image/webp":
      return (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    case "image/avif": {
      if (bytes.length < 12 || bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70) {
        return false;
      }

      const brands = new TextDecoder().decode(bytes.subarray(8, Math.min(bytes.length, 32)));
      return brands.includes("avif") || brands.includes("avis");
    }
  }
}

function sanitizeFilename(filename: string): string {
  const basename = filename.replaceAll("\\", "/").split("/").pop()?.trim() || "upload";
  const withoutExtension = basename.replace(/\.[^/.]+$/, "");
  const sanitized = withoutExtension
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  return sanitized || "upload";
}

export function createBlobFilename(
  prefix: "upload" | "thumbnail",
  filename: string,
  contentType: AllowedImageMimeType
) {
  return `${prefix}-${randomUUID()}-${sanitizeFilename(filename)}${MIME_EXTENSIONS[contentType]}`;
}

export async function readUploadPayload(request: Request): Promise<UploadPayload> {
  if (!request.body) {
    throw new UploadPolicyError("NO_FILE", 400, "No file provided");
  }

  const contentType = normalizeContentType(request.headers.get("content-type"));
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(contentType as AllowedImageMimeType)) {
    throw new UploadPolicyError("UNSUPPORTED_MEDIA_TYPE", 415, "Only approved image MIME types are allowed");
  }

  const declaredLength = Number.parseInt(request.headers.get("content-length") || "", 10);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES) {
    throw new UploadPolicyError("FILE_TOO_LARGE", 413, "File size must be 10 MiB or less");
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      throw new UploadPolicyError("FILE_TOO_LARGE", 413, "File size must be 10 MiB or less");
    }

    chunks.push(value);
  }

  if (totalBytes === 0) {
    throw new UploadPolicyError("NO_FILE", 400, "No file provided");
  }

  const bytes = Buffer.alloc(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const normalizedContentType = contentType as AllowedImageMimeType;
  if (!hasImageSignature(normalizedContentType, bytes)) {
    throw new UploadPolicyError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
      "The uploaded bytes do not match the declared image MIME type"
    );
  }

  return { bytes, contentType: normalizedContentType };
}
