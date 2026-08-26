import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../test-utils";
import { PostViewersModal } from "@/components/modals/PostViewersModal";
import { usePostViewers } from "@/hooks/usePostViewers";

vi.mock("@/hooks/usePostViewers", () => ({
  POST_VIEW_RECORD_PAGE_SIZE: 50,
  usePostViewers: vi.fn(),
}));

const mockUsePostViewers = vi.mocked(usePostViewers);

describe("PostViewersModal", () => {
  it("관리자용 조회 기록과 visitorId·user-agent 원문을 표시한다", () => {
    mockUsePostViewers.mockReturnValue({
      data: {
        post: { id: "post-1", title: "테스트 포스트" },
        summary: {
          uniqueVisitorCount: 3,
          uniqueIpCount: 1,
          viewRecords: 4,
          viewRecordsWithIp: 4,
          viewRecordsWithoutIp: 0,
        },
        records: [
          {
            ipAddress: "203.0.113.7",
            visitorId: "visitor-1",
            userAgent: "Mozilla/5.0 (Test Browser)",
            viewedAt: "2026-08-26T01:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
      },
      isError: false,
      isLoading: false,
      isFetching: false,
    } as ReturnType<typeof usePostViewers>);

    render(
      <PostViewersModal
        open
        onOpenChange={vi.fn()}
        postId="post-1"
        postTitle="테스트 포스트"
        totalViews={3}
        dailyViews={1}
      />
    );

    expect(screen.getByRole("heading", { name: "조회 기록 상세" })).toBeInTheDocument();
    expect(screen.getByText("203.0.113.7")).toBeInTheDocument();
    expect(screen.getByText("visitor-1")).toBeInTheDocument();
    expect(screen.getByText("Mozilla/5.0 (Test Browser)")).toBeInTheDocument();
    expect(screen.getByText(/visitorId 우선 distinct 집계/)).toBeInTheDocument();
    expect(screen.getByText(/PostView에 저장된 원문/)).toBeInTheDocument();
  });
});
