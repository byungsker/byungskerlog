"use client";

import { useQuery } from "@tanstack/react-query";
import type { AdminPostListItem } from "@/lib/types/post";
import { queryKeys, type AdminPostsFilters } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

export interface AdminPostsData {
  posts: AdminPostListItem[];
}

interface UseAdminPostsOptions {
  filters?: AdminPostsFilters;
  enabled?: boolean;
}

async function fetchAdminPosts(filters: AdminPostsFilters): Promise<AdminPostsData> {
  const params = new URLSearchParams({
    limit: "100",
    includeUnpublished: "true",
  });

  if (filters.sortBy) {
    params.set("sortBy", filters.sortBy);
  }

  if (filters.tag && filters.tag !== "all") {
    params.set("tag", filters.tag);
  }

  if (filters.type && filters.type !== "all") {
    params.set("type", filters.type);
  }

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  return apiClient.get<AdminPostsData>(`/api/posts?${params}`);
}

export function useAdminPosts(options: UseAdminPostsOptions = {}) {
  const { filters = {}, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.posts.adminList(filters),
    queryFn: () => fetchAdminPosts(filters),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
