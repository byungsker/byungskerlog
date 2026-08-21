"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

type StatType = "category" | "views" | "count" | "reading";

export interface CategoryStat {
  tag: string;
  count: number;
}

export interface ViewsStat {
  title: string;
  slug: string;
  views: number;
}

export interface CountStat {
  date: string;
  count: number;
}

export interface ReadingStat {
  title: string;
  slug: string;
  sessions: number;
  avgDepth: number;
  completionRate: number;
}

interface UsePostAnalyticsOptions {
  startDate?: string;
  endDate?: string;
  type: "all" | "LONG" | "SHORT";
  statType: StatType;
  enabled?: boolean;
}

export function usePostAnalytics<T = CategoryStat[] | ViewsStat[] | CountStat[] | ReadingStat[]>(
  options: UsePostAnalyticsOptions
) {
  const { startDate, endDate, type, statType, enabled = true } = options;

  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  params.set("type", type);
  params.set("statType", statType);

  return useQuery({
    queryKey: ["post-analytics", { startDate, endDate, type, statType }],
    queryFn: () => apiClient.get<T>(`/api/posts/analytics?${params}`),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryAnalytics(options: Omit<UsePostAnalyticsOptions, "statType">) {
  return usePostAnalytics<CategoryStat[]>({ ...options, statType: "category" });
}

export function useViewsAnalytics(options: Omit<UsePostAnalyticsOptions, "statType">) {
  return usePostAnalytics<ViewsStat[]>({ ...options, statType: "views" });
}

export function useCountAnalytics(options: Omit<UsePostAnalyticsOptions, "statType">) {
  return usePostAnalytics<CountStat[]>({ ...options, statType: "count" });
}

export function useReadingAnalytics(options: Omit<UsePostAnalyticsOptions, "statType">) {
  return usePostAnalytics<ReadingStat[]>({ ...options, statType: "reading" });
}
