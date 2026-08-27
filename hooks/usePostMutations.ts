"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Post } from "@/lib/types/post";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";

export interface CreatePostData {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  tags?: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  thumbnail?: string | null;
  seriesId?: string | null;
}

export interface UpdatePostData {
  title?: string;
  slug?: string;
  subSlug?: string | null;
  content?: string;
  excerpt?: string | null;
  tags?: string[];
  type?: "LONG" | "SHORT";
  published?: boolean;
  thumbnail?: string | null;
  seriesId?: string | null;
  linkedinUrl?: string | null;
  threadsUrl?: string | null;
  linkedinContent?: string | null;
  threadsContent?: string[];
}

interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

export function useCreatePost(options: MutationOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: (data: CreatePostData) => apiClient.post<Post>("/api/posts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });

      if (showToast) {
        toast.success("포스트가 생성되었습니다.");
      }

      router.refresh();
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || "포스트 생성에 실패했습니다.");
      }
      onError?.(error);
    },
  });
}

export function useUpdatePost(options: MutationOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostData }) => apiClient.patch<Post>(`/api/posts/${id}`, data),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(updatedPost.slug),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detailById(updatedPost.id),
      });

      if (showToast) {
        toast.success("포스트가 수정되었습니다.");
      }

      router.refresh();
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || "포스트 수정에 실패했습니다.");
      }
      onError?.(error);
    },
  });
}

export function useDeletePost(options: MutationOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ message: string }>(`/api/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all });

      if (showToast) {
        toast.success("포스트가 삭제되었습니다.");
      }

      router.refresh();
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || "포스트 삭제에 실패했습니다.");
      }
      onError?.(error);
    },
  });
}

export function usePublishPost(options: MutationOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      apiClient.patch<Post>(`/api/posts/${id}`, { published }),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(updatedPost.slug),
      });

      if (showToast) {
        toast.success(updatedPost.published ? "포스트가 게시되었습니다." : "포스트가 비공개 처리되었습니다.");
      }

      router.refresh();
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || "게시 상태 변경에 실패했습니다.");
      }
      onError?.(error);
    },
  });
}

export function useUpdateSocialLinks(options: MutationOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { onSuccess, onError, showToast = true } = options;

  return useMutation({
    mutationFn: ({
      id,
      linkedinUrl,
      threadsUrl,
    }: {
      id: string;
      linkedinUrl?: string | null;
      threadsUrl?: string | null;
    }) => apiClient.patch<Post>(`/api/posts/${id}`, { linkedinUrl, threadsUrl }),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.shortPosts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.posts.detail(updatedPost.slug),
      });

      if (showToast) {
        toast.success("SNS 링크가 업데이트되었습니다.");
      }

      router.refresh();
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showToast) {
        toast.error(error.message || "SNS 링크 업데이트에 실패했습니다.");
      }
      onError?.(error);
    },
  });
}
