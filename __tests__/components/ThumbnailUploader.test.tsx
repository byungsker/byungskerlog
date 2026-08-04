import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThumbnailUploader } from "@/components/editor/ThumbnailUploader";

describe("ThumbnailUploader", () => {
  it("썸네일 삭제 버튼에 동작 이름과 키보드 초점 표시를 제공한다", () => {
    const onFileChange = vi.fn();
    const onRemove = vi.fn();

    render(<ThumbnailUploader previewUrl="/thumbnail.png" onFileChange={onFileChange} onRemove={onRemove} />);

    const removeButton = screen.getByRole("button", { name: "썸네일 삭제" });
    expect(removeButton).toHaveClass("focus-visible:ring-2", "focus-visible:ring-ring");

    fireEvent.click(removeButton);
    expect(onFileChange).toHaveBeenCalledWith(null);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
