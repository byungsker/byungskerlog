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

  it.each([
    {
      name: "thumbnail.txt",
      type: "text/plain",
      size: 10,
      message: "이미지 파일만 업로드 가능합니다.",
    },
    {
      name: "thumbnail.png",
      type: "image/png",
      size: 10 * 1024 * 1024 + 1,
      message: "파일 크기는 10MB 이하여야 합니다.",
    },
  ])("$message 오류가 있는 파일을 거부한다", ({ name, type, size, message }) => {
    const onFileChange = vi.fn();
    const { container } = render(
      <ThumbnailUploader previewUrl={null} onFileChange={onFileChange} onRemove={vi.fn()} />
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(["test"], name, { type });
    Object.defineProperty(file, "size", { value: size });

    fireEvent.change(input!, { target: { files: [file] } });

    expect(screen.getByText(message)).toBeInTheDocument();
    expect(onFileChange).not.toHaveBeenCalled();
  });
});
