export interface PostListFilters {
  page: number;
  limit: number;
  sortBy: string;
}

export interface AdminPostsFilters {
  tag?: string;
  type?: string;
  sortBy?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const queryKeys = {
  comments: {
    all: ["comments"] as const,
    list: (postId: string) => [...queryKeys.comments.all, "list", postId] as const,
  },

  knowledgePresets: {
    all: ["ai-knowledge-presets"] as const,
    lists: () => [...queryKeys.knowledgePresets.all, "list"] as const,
    detail: (id: string) => [...queryKeys.knowledgePresets.all, "detail", id] as const,
  },

  posts: {
    all: ["posts"] as const,
    lists: () => [...queryKeys.posts.all, "list"] as const,
    list: (filters: PostListFilters) =>
      [...queryKeys.posts.lists(), filters.page, filters.limit, filters.sortBy] as const,
    home: () => [...queryKeys.posts.all, "home"] as const,
    homeLatest: () => [...queryKeys.posts.home(), "latest"] as const,
    homePopular: () => [...queryKeys.posts.home(), "popular"] as const,
    byTag: (tag: string | null) => [...queryKeys.posts.all, "by-tag", tag] as const,
    details: () => [...queryKeys.posts.all, "detail"] as const,
    detail: (slug: string) => [...queryKeys.posts.details(), slug] as const,
    detailById: (id: string) => [...queryKeys.posts.details(), "id", id] as const,
    viewers: (id: string, page: number) => [...queryKeys.posts.all, "viewers", id, page] as const,
    adminLists: () => [...queryKeys.posts.all, "admin"] as const,
    adminList: (filters: AdminPostsFilters) => [...queryKeys.posts.adminLists(), filters] as const,
  },

  shortPosts: {
    all: ["short-posts"] as const,
    lists: () => [...queryKeys.shortPosts.all, "list"] as const,
    list: (page: number) => [...queryKeys.shortPosts.lists(), page] as const,
  },

  tags: {
    all: ["tags"] as const,
  },

  visitors: {
    all: ["visitor-stats"] as const,
  },

  drafts: {
    all: ["drafts"] as const,
    lists: () => [...queryKeys.drafts.all, "list"] as const,
    detail: (id: string) => [...queryKeys.drafts.all, "detail", id] as const,
  },

  series: {
    all: ["series"] as const,
    lists: () => [...queryKeys.series.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.series.all, "detail", slug] as const,
  },
} as const;
