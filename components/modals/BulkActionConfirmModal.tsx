"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import type { AdminPostListItem } from "@/lib/types/post";

type BulkAction = "delete" | "publish" | "unpublish";

interface BulkActionConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: BulkAction | null;
  selectedPosts: AdminPostListItem[];
  onConfirm: () => void;
  isPending: boolean;
}

const actionConfig: Record<
  BulkAction,
  { title: string; description: string; buttonText: string; buttonPendingText: string }
> = {
  delete: {
    title: "선택한 글을 삭제하시겠습니까?",
    description: "선택한 글이 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
    buttonText: "삭제",
    buttonPendingText: "삭제 중...",
  },
  publish: {
    title: "선택한 글을 공개하시겠습니까?",
    description: "선택한 글이 모두 공개 상태로 변경됩니다.",
    buttonText: "공개",
    buttonPendingText: "처리 중...",
  },
  unpublish: {
    title: "선택한 글을 비공개 처리하시겠습니까?",
    description: "선택한 글이 모두 비공개 상태로 변경됩니다.",
    buttonText: "비공개",
    buttonPendingText: "처리 중...",
  },
};

export function BulkActionConfirmModal({
  open,
  onOpenChange,
  action,
  selectedPosts,
  onConfirm,
  isPending,
}: BulkActionConfirmModalProps) {
  if (!action) return null;

  const config = actionConfig[action];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bulk-action-confirm-modal max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>{config.description}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="bulk-action-selected-list my-4 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
          <p className="text-sm font-medium mb-2 text-muted-foreground">선택된 글 ({selectedPosts.length}개)</p>
          <ul className="space-y-1">
            {selectedPosts.map((post) => (
              <li key={post.id} className="text-sm truncate flex items-center gap-2">
                <span className="flex-1 truncate">{post.title}</span>
                {post.type === "SHORT" && (
                  <span className="px-1.5 py-0.5 text-xs bg-violet-500/10 text-violet-500 rounded flex-shrink-0">
                    Short
                  </span>
                )}
                {!post.published && (
                  <span className="px-1.5 py-0.5 text-xs bg-muted text-muted-foreground rounded flex-shrink-0">
                    비공개
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className={action === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {isPending ? config.buttonPendingText : config.buttonText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
