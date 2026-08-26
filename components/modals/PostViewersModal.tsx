"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { usePostViewers } from "@/hooks/usePostViewers";

interface PostViewersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postTitle: string;
  totalViews: number;
  dailyViews: number;
}

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function PostViewersModal({
  open,
  onOpenChange,
  postId,
  postTitle,
  totalViews,
  dailyViews,
}: PostViewersModalProps) {
  const paginationKey = `${postId}:${open ? "open" : "closed"}`;
  const [paginationState, setPaginationState] = useState({ key: paginationKey, page: 1 });
  const page = paginationState.key === paginationKey ? paginationState.page : 1;

  const updatePage = (update: (currentPage: number) => number) => {
    setPaginationState((current) => ({
      key: paginationKey,
      page: update(current.key === paginationKey ? current.page : 1),
    }));
  };

  const { data, isError, isLoading, isFetching } = usePostViewers(postId, page, { enabled: open });

  const totalPages = data?.pagination.totalPages ?? 1;
  const uniqueVisitorCount = data?.summary.uniqueVisitorCount ?? totalViews;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-6xl overflow-hidden sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            조회 기록 상세
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{postTitle}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-relaxed text-muted-foreground">
            조회수는 <strong className="text-foreground">visitorId 우선 distinct 집계</strong>입니다. IP는 보조 확인
            정보이며, 공유 네트워크·쿠키 변경에 따라 실제 사람 수와 다를 수 있습니다. 아래 IP, visitorId, user-agent는{" "}
            <strong className="text-foreground">PostView에 저장된 원문</strong>이고 관리자에게만 표시됩니다. 값이 없거나{" "}
            <code className="mx-1 rounded bg-muted px-1">unknown</code>인 기록도 포함됩니다.
          </div>

          {data && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-semibold">{uniqueVisitorCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">누적 고유 사용자</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-semibold">{dailyViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">오늘 고유 사용자</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-semibold">{data.summary.uniqueIpCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">저장된 고유 IP</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-semibold">{data.summary.viewRecordsWithoutIp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">IP 미수집 기록</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div
              role="status"
              className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              조회 기록을 불러오는 중...
            </div>
          ) : isError ? (
            <div role="alert" className="flex min-h-40 items-center justify-center text-sm text-destructive">
              조회 기록을 불러오지 못했습니다.
            </div>
          ) : data?.records.length ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="min-w-36 px-3 py-2 font-medium">
                      IP
                    </th>
                    <th scope="col" className="min-w-52 px-3 py-2 font-medium">
                      visitorId
                    </th>
                    <th scope="col" className="min-w-80 px-3 py-2 font-medium">
                      User-Agent
                    </th>
                    <th scope="col" className="min-w-36 px-3 py-2 text-right font-medium">
                      조회 시각
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.records.map((entry, index) => (
                    <tr key={`${entry.viewedAt}-${index}`}>
                      <td className="max-w-48 break-all px-3 py-2 align-top font-mono text-xs">
                        {entry.ipAddress ?? "없음"}
                      </td>
                      <td className="max-w-64 break-all px-3 py-2 align-top font-mono text-xs">
                        {entry.visitorId ?? "없음"}
                      </td>
                      <td className="max-w-[28rem] whitespace-pre-wrap break-words px-3 py-2 align-top font-mono text-xs">
                        {entry.userAgent ?? "없음"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right align-top text-xs text-muted-foreground">
                        {formatDate(entry.viewedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div role="status" className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
              조회 기록이 없습니다.
            </div>
          )}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isFetching && !isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>
              {data?.pagination.total.toLocaleString() ?? 0}개 조회 기록 · {page}/{totalPages} 페이지
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="이전 페이지"
              onClick={() => updatePage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || isFetching}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="다음 페이지"
              onClick={() => updatePage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || isFetching}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button type="button" variant="default" size="sm" onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
