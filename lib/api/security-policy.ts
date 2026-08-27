export const API_RATE_LIMITS = {
  views: { limit: 60, window: "1 minute", key: "client IP" },
  readingSession: { limit: 120, window: "1 minute", key: "client IP" },
  visitors: { limit: 30, window: "1 minute", key: "admin user ID" },
  upload: { limit: 10, window: "1 minute", key: "admin user ID" },
} as const;

export type ApiAuthBoundary = "public" | "authenticated user" | "admin" | "mixed";

/**
 * API routes are intentionally excluded from middleware. Authentication and
 * abuse controls therefore belong to the route handler, and this matrix is
 * the compact route-level contract for the security-sensitive surface.
 */
export const API_SECURITY_MATRIX = [
  {
    route: "middleware matcher",
    methods: ["*"],
    boundary: "route-owned" as const,
    rateLimit: "each API handler owns its policy",
    notes: "/api is excluded from shared middleware; do not infer API auth from page redirects.",
  },
  {
    route: "POST /api/posts-by-slug/[slug]/views",
    methods: ["POST"],
    boundary: "public" as ApiAuthBoundary,
    rateLimit: `${API_RATE_LIMITS.views.limit}/${API_RATE_LIMITS.views.window}/${API_RATE_LIMITS.views.key}`,
    notes: "Preserves anonymous visitorId cookie and stored-IP compatibility semantics.",
  },
  {
    route: "POST /api/posts-by-slug/[slug]/reading-session",
    methods: ["POST"],
    boundary: "public" as ApiAuthBoundary,
    rateLimit: `${API_RATE_LIMITS.readingSession.limit}/${API_RATE_LIMITS.readingSession.window}/${API_RATE_LIMITS.readingSession.key}`,
    notes: "Public telemetry write; rate limit is applied before the post lookup and session write.",
  },
  {
    route: "GET /api/visitors",
    methods: ["GET"],
    boundary: "admin" as ApiAuthBoundary,
    rateLimit: `${API_RATE_LIMITS.visitors.limit}/${API_RATE_LIMITS.visitors.window}/${API_RATE_LIMITS.visitors.key}`,
    notes: "Returns unique visitor counts only after authenticated admin authorization.",
  },
  {
    route: "POST /api/upload and POST /api/upload/thumbnail",
    methods: ["POST"],
    boundary: "admin" as ApiAuthBoundary,
    rateLimit: `${API_RATE_LIMITS.upload.limit}/${API_RATE_LIMITS.upload.window}/${API_RATE_LIMITS.upload.key}`,
    notes: "10 MiB maximum, allowlisted raster-image MIME and signature checks, randomized blob names.",
  },
  {
    route: "GET /api/posts, GET /api/posts/[id], GET /api/posts-by-slug/[slug]/stats",
    methods: ["GET"],
    boundary: "mixed" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Published content is public; private post inventory/detail is admin-only in the handler.",
  },
  {
    route: "POST /api/posts, PATCH/DELETE /api/posts/[id], POST /api/posts/bulk",
    methods: ["POST", "PATCH", "DELETE"],
    boundary: "admin" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Mutation routes require authenticated administrator authorization.",
  },
  {
    route:
      "GET /api/books, GET /api/books/[id], GET /api/books/search, GET /api/series, GET /api/tags, GET /api/pages/[slug], GET /api/og",
    methods: ["GET"],
    boundary: "public" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Public read surfaces; expensive or provider-backed controls remain outside this issue.",
  },
  {
    route: "POST /api/books, PUT/DELETE /api/books/[id], POST /api/series, PATCH/DELETE /api/series/[id]",
    methods: ["POST", "PUT", "PATCH", "DELETE"],
    boundary: "authenticated user" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Existing handlers require a logged-in Stack user.",
  },
  {
    route: "GET/POST /api/drafts and GET/PATCH/DELETE /api/drafts/[id]",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    boundary: "authenticated user" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Existing handlers require authentication and scope records to the logged-in user.",
  },
  {
    route: "GET/POST /api/snippets and PATCH/DELETE /api/snippets/[id]",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    boundary: "mixed" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Public reads remain available; mutations require a logged-in Stack user.",
  },
  {
    route: "GET/POST/PATCH/DELETE /api/ai-knowledge-presets* and POST /api/ai/convert-social",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    boundary: "mixed" as ApiAuthBoundary,
    rateLimit: "AI conversion: existing 20/minute/user; preset routes: none in this issue",
    notes: "AI conversion keeps its existing user rate limit; preset reads are public and writes are authenticated.",
  },
  {
    route: "PATCH /api/posts/[id]/sub-slug, PUT /api/pages/[slug], POST /api/auth/delete-unauthorized",
    methods: ["POST", "PATCH", "PUT"],
    boundary: "authenticated user" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Existing handlers require a logged-in Stack user before mutation or account action.",
  },
  {
    route: "GET /api/posts/analytics",
    methods: ["GET"],
    boundary: "admin" as ApiAuthBoundary,
    rateLimit: "none in this issue",
    notes: "Admin-only read; BYU-316 limits public telemetry writes and visitor stats abuse.",
  },
] as const;
