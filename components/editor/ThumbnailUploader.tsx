"use client";

import { useState, useCallback } from "react";
import { ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Image from "next/image";

interface ThumbnailUploaderProps {
  previewUrl: string | null;
  onFileChange: (file: File | null) => void;
  onRemove: () => void;
  disabled?: boolean;
}

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export function ThumbnailUploader({ previewUrl, onFileChange, onRemove, disabled }: ThumbnailUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(
    (file: File) => {
      setError(null);

      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }

      if (file.size > MAX_UPLOAD_SIZE) {
        setError("파일 크기는 10MB 이하여야 합니다.");
        return;
      }

      onFileChange(file);
    },
    [onFileChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(() => {
    onFileChange(null);
    onRemove();
    setError(null);
  }, [onFileChange, onRemove]);

  const isBlobUrl = previewUrl?.startsWith("blob:");

  return (
    <div className="thumbnail-uploader space-y-2">
      <label className="text-sm font-medium">썸네일 이미지</label>

      {previewUrl ? (
        <div className="thumbnail-preview relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
          <Image
            src={previewUrl}
            alt="썸네일 미리보기"
            fill
            sizes="(min-width: 640px) 400px, 100vw"
            className="object-cover"
            unoptimized={isBlobUrl}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="썸네일 삭제"
            className="absolute top-2 right-2 h-8 w-8 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`thumbnail-dropzone flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} disabled={disabled} />
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-sm">이미지를 드래그하거나 클릭하여 업로드</span>
            <span className="text-xs">자동 최적화 (500KB 이하로 압축)</span>
          </div>
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
