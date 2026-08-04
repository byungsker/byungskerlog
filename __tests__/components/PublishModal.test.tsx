import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublishModal } from "@/components/modals/PublishModal";

vi.mock("@/hooks/useSocialMediaConvert", () => ({
  useSocialMediaConvert: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/hooks/useKnowledgePresets", () => ({
  useKnowledgePresets: () => ({ data: [] }),
}));

vi.mock("@/components/editor/ThumbnailUploader", () => ({
  ThumbnailUploader: ({ previewUrl }: { previewUrl: string | null }) => (
    <div data-testid="thumbnail-preview-state">{previewUrl ?? "empty"}</div>
  ),
}));

vi.mock("@/components/editor/SeriesSelect", () => ({
  SeriesSelect: () => <div data-testid="series-select" />,
}));

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  title: "Vue Query 타입 회귀",
  content: "![긴 이미지](https://example.com/" + "very-long-path-".repeat(30) + ")",
  tags: ["tanstack", "query"],
  isEditMode: true,
  postId: "post-1",
  onPublishSuccess: vi.fn(),
  postType: "LONG" as const,
  onPostTypeChange: vi.fn(),
  thumbnailUrl: "https://example.com/thumbnail.png",
  thumbnailFile: null,
  onThumbnailFileChange: vi.fn(),
  onThumbnailRemove: vi.fn(),
  seriesId: null,
  onSeriesIdChange: vi.fn(),
  excerpt: "설명",
  onExcerptChange: vi.fn(),
  slug: "vue-query-type-regression",
  onSlugChange: vi.fn(),
  subSlug: "",
  onSubSlugChange: vi.fn(),
};

describe("PublishModal", () => {
  beforeEach(() => {
    Object.values(defaultProps).forEach((value) => {
      if (typeof value === "function" && "mockClear" in value) {
        value.mockClear();
      }
    });
    window.innerWidth = 1440;
    window.dispatchEvent(new Event("resize"));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("긴 소셜 콘텐츠가 모달 경계를 벗어나거나 footer와 겹치지 않는 스크롤 구조를 사용한다", () => {
    render(<PublishModal {...defaultProps} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("max-h-[calc(100dvh-2rem)]", "flex", "flex-col", "overflow-hidden");

    const modalContent = dialog.querySelector(".publish-modal-content");
    const tabContent = dialog.querySelector(".tab-content");
    const settingsContent = dialog.querySelector(".settings-content");
    const settingsGrid = dialog.querySelector(".publish-modal-grid");
    expect(modalContent).toHaveClass("min-h-0", "overflow-hidden");
    expect(tabContent).toHaveClass("min-h-0", "overflow-y-auto", "overflow-x-hidden");
    expect(settingsContent).toHaveClass("min-w-0");
    expect(settingsGrid).toHaveClass("grid-cols-[minmax(0,1fr)]", "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]");

    fireEvent.click(screen.getByRole("tab", { name: "LinkedIn" }));
    expect(screen.getByPlaceholderText("LinkedIn 콘텐츠...")).toHaveClass(
      "min-w-0",
      "w-full",
      "[overflow-wrap:anywhere]"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Short" }));
    expect(screen.getByPlaceholderText("Short Post 본문을 입력하세요...")).toHaveClass(
      "min-w-0",
      "w-full",
      "[overflow-wrap:anywhere]"
    );

    fireEvent.click(screen.getByRole("tab", { name: "Threads" }));
    expect(screen.getByPlaceholderText("Threads 포스트 1...")).toHaveClass(
      "min-w-0",
      "w-full",
      "[overflow-wrap:anywhere]"
    );
  });

  it("글 유형과 소셜 탭을 왕복해도 명시적으로 삭제하지 않은 기존 썸네일을 유지한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: defaultProps.slug }),
    });
    vi.stubGlobal("fetch", fetchMock);

    function ControlledPublishModal() {
      const [postType, setPostType] = useState<"LONG" | "SHORT">("LONG");
      const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(defaultProps.thumbnailUrl);

      return (
        <PublishModal
          {...defaultProps}
          postType={postType}
          onPostTypeChange={setPostType}
          thumbnailUrl={thumbnailUrl}
          onThumbnailRemove={() => {
            defaultProps.onThumbnailRemove();
            setThumbnailUrl(null);
          }}
        />
      );
    }

    render(<ControlledPublishModal />);
    expect(screen.getByTestId("thumbnail-preview-state")).toHaveTextContent(defaultProps.thumbnailUrl);

    fireEvent.click(screen.getByRole("radio", { name: "Short Post" }));
    fireEvent.click(screen.getByRole("tab", { name: "LinkedIn" }));
    fireEvent.click(screen.getByRole("tab", { name: "Threads" }));
    fireEvent.click(screen.getByRole("radio", { name: "Long Post" }));
    fireEvent.click(screen.getByRole("tab", { name: "Short" }));
    fireEvent.click(screen.getByRole("tab", { name: "LinkedIn" }));
    fireEvent.click(screen.getByRole("tab", { name: "Threads" }));
    fireEvent.click(screen.getByRole("tab", { name: "개요" }));

    expect(defaultProps.onThumbnailRemove).not.toHaveBeenCalled();
    expect(screen.getByTestId("thumbnail-preview-state")).toHaveTextContent(defaultProps.thumbnailUrl);

    fireEvent.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.thumbnail).toBe(defaultProps.thumbnailUrl);
  });

  it("Short Post로 최종 저장할 때만 보존 중인 Long Post 썸네일을 payload에서 제거한다", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ slug: defaultProps.slug }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PublishModal {...defaultProps} postType="SHORT" />);
    fireEvent.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(requestBody.thumbnail).toBeNull();
    expect(defaultProps.onThumbnailRemove).not.toHaveBeenCalled();
  });

  it("탭의 선택 상태와 패널 관계를 알리고 화살표 키로 이동한다", async () => {
    render(<PublishModal {...defaultProps} />);

    const tabList = screen.getByRole("tablist", { name: "Long Post 미리보기" });
    const settingsTab = screen.getByRole("tab", { name: "개요" });
    expect(tabList).toContainElement(settingsTab);
    expect(settingsTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", settingsTab.id);

    fireEvent.keyDown(settingsTab, { key: "ArrowRight" });

    const shortTab = screen.getByRole("tab", { name: "Short" });
    expect(shortTab).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(shortTab).toHaveFocus());
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", shortTab.id);
  });

  it("모바일에서도 대화상자 의미·Escape 닫기·초점 복귀 계약을 유지한다", async () => {
    window.innerWidth = 320;
    window.dispatchEvent(new Event("resize"));

    function MobileDialogHarness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            미리보기 열기
          </button>
          <PublishModal {...defaultProps} open={open} onOpenChange={setOpen} />
        </>
      );
    }

    render(<MobileDialogHarness />);
    const openButton = screen.getByRole("button", { name: "미리보기 열기" });
    openButton.focus();
    fireEvent.click(openButton);

    const dialog = await screen.findByRole("dialog", { name: "포스트 미리보기" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "닫기" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(openButton).toHaveFocus());
  });

  it.each([
    {
      field: "url",
      apiMessage: "A post url with this identifier already exists",
      expectedMessage: "이 URL은 이미 사용 중입니다. 아래에서 URL을 수정해주세요.",
    },
    {
      field: "tag",
      apiMessage: "A tag with this identifier already exists",
      expectedMessage: "A tag with this identifier already exists",
    },
  ])("중복 필드 $field 오류를 정확한 수정 메시지로 표시한다", async ({ field, apiMessage, expectedMessage }) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ code: "DUPLICATE_ENTRY", error: apiMessage, details: { field } }),
      })
    );

    render(<PublishModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "수정하기" }));

    expect(await screen.findByText(expectedMessage)).toBeInTheDocument();
  });
});
