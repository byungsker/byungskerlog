/**
 * Series type definition
 */
export interface Series {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: {
    posts: number;
  };
}

/**
 * Post type definition matching Prisma schema
 * Used across the application for type safety
 * Note: Dates can be Date objects or ISO strings depending on serialization context
 */
export interface Post {
  id: string;
  slug: string;
  subSlug?: string | null;
  title: string;
  content: string;
  excerpt: string | null;
  thumbnail: string | null;
  tags: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  series?: Series | null;
  totalViews?: number;
  dailyViews?: number;
  linkedinUrl?: string | null;
  threadsUrl?: string | null;
  linkedinContent?: string | null;
  threadsContent?: string[];
  readingSessions?: number | null;
  avgScrollDepth?: number | null;
  completionRate?: number | null;
  // Long ↔ Short 1:1 연결
  linkedShortPostId?: string | null;
  linkedShortPost?: Post | null;
  linkedLongPost?: Post | null;
}

/**
 * Post type for list views (excludes full content for performance)
 */
export interface PostPreview {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  thumbnail: string | null;
  tags: string[];
  type?: "LONG" | "SHORT";
  createdAt: Date | string;
  series?: Series | null;
  totalViews?: number;
}

/**
 * Post fields returned by the admin list endpoint.
 * Full content and SNS copy are loaded only when a detail surface needs them.
 */
export interface AdminPostListItem {
  id: string;
  slug: string;
  subSlug?: string | null;
  title: string;
  excerpt: string | null;
  tags: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  createdAt: Date | string;
  totalViews?: number;
  dailyViews?: number;
  linkedinUrl?: string | null;
  threadsUrl?: string | null;
  readingSessions?: number | null;
  avgScrollDepth?: number | null;
  completionRate?: number | null;
}

/**
 * Alias for Post used in home page contexts
 */
export type HomePost = Post;

/**
 * Short Post type (subset of Post with type="SHORT")
 */
export interface ShortPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  tags: string[];
  createdAt: Date | string;
  series?: Series | null;
  linkedinUrl?: string | null;
  threadsUrl?: string | null;
  linkedinContent?: string | null;
  threadsContent?: string[];
}

/**
 * Draft type definition
 */
export interface Draft {
  id: string;
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
