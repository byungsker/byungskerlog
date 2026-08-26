"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import type { PostViewersData } from "@/lib/types/post-view";

export const POST_VIEW_RECORD_PAGE_SIZE = 50;

interface UsePostViewersOptions {
  enabled?: boolean;
}

export function usePostViewers(postId: string, page: number, options: UsePostViewersOptions = {}) {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.posts.viewers(postId, page),
    queryFn: () =>
      apiClient.get<PostViewersData>(
        `/api/posts/${encodeURIComponent(postId)}/viewers?page=${page}&limit=${POST_VIEW_RECORD_PAGE_SIZE}`
      ),
    staleTime: 30 * 1000,
    enabled: Boolean(postId) && enabled,
  });
}
