"use client";

import { useQuery } from "@tanstack/react-query";
import { useUser } from "@stackframe/stack";
import { Users } from "lucide-react";
import { queryKeys } from "@/lib/queryKeys";
import { apiClient } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/Skeleton";

interface VisitorStats {
  today: number;
  total: number;
}

async function fetchVisitorStats(): Promise<VisitorStats> {
  return apiClient.get<VisitorStats>("/api/visitors");
}

export function VisitorCount() {
  const user = useUser();

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: queryKeys.visitors.all,
    queryFn: fetchVisitorStats,
    enabled: !!user, // 로그인한 경우에만 쿼리 실행
    staleTime: 30 * 1000, // 30초간 fresh 상태 유지
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    refetchOnWindowFocus: true, // 윈도우 포커스 시 재검증
    retry: false,
  });

  // Don't render if user is not logged in
  if (!user) return null;

  // Show skeleton while loading (icon always visible)
  if (isLoading) {
    return (
      <div className="visitor-count-skeleton flex items-center gap-2 text-xs text-muted-foreground pl-4">
        <Users className="h-3.5 w-3.5" />
        <Skeleton className="h-4 w-[140px]" />
      </div>
    );
  }

  // Don't render if stats failed to load
  if (isError || !stats) return null;

  return (
    <div
      className="flex items-center gap-2 text-xs text-muted-foreground pl-4"
      title="익명 visitorId 쿠키 기준 고유 사용자 수이며, 쿠키가 없는 기존 기록은 IP를 호환 키로 사용합니다."
    >
      <Users className="h-3.5 w-3.5" />
      <span>
        오늘 고유 방문자 {stats.today} · 누적 고유 방문자 {stats.total}
      </span>
    </div>
  );
}
