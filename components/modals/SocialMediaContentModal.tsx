"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { X, Copy, Maximize2, Minimize2, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";
import { useUpdatePost } from "@/hooks/usePostMutations";
import { usePost } from "@/hooks/usePost";
import { cn } from "@/lib/utils";

const LINKEDIN_CHAR_LIMIT = 3000;
const THREADS_CHAR_LIMIT = 500;

interface SocialMediaContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  platform: "linkedin" | "threads";
  linkedinContent?: string | null;
  threadsContent?: string[];
  linkedinUrl?: string | null;
  threadsUrl?: string | null;
  onUpdate?: () => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

function formatCount(count: number): string {
  return count.toLocaleString();
}

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={cn("h-4 w-4", className)} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.291 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126.742a12.833 12.833 0 0 0-2.787-.13c-1.21.07-2.2.415-2.865 1.002-.684.604-1.045 1.411-.99 2.216.05.879.485 1.622 1.229 2.096.682.435 1.569.636 2.488.565 1.248-.096 2.218-.543 2.88-1.329.52-.62.86-1.467.976-2.521a4.525 4.525 0 0 1 1.065.258c1.164.438 1.957 1.217 2.362 2.31.588 1.586.621 4.013-1.569 6.127-1.82 1.755-4.093 2.549-7.156 2.582z" />
  </svg>
);

export function SocialMediaContentModal({
  open,
  onOpenChange,
  postId,
  platform,
  linkedinContent: initialLinkedinContent,
  threadsContent: initialThreadsContent,
  linkedinUrl,
  threadsUrl,
  onUpdate,
}: SocialMediaContentModalProps) {
  const isMobile = useIsMobile();
  const {
    data: postDetail,
    isLoading: isPostDetailLoading,
    isError: isPostDetailError,
  } = usePost(postId, {
    enabled: open,
  });
  const [isFullView, setIsFullView] = useState(false);
  const [linkedinContentOverride, setLinkedinContentOverride] = useState<string | undefined>();
  const [threadsContentOverride, setThreadsContentOverride] = useState<string[] | undefined>();
  const [hasChanges, setHasChanges] = useState(false);

  const linkedinContent = linkedinContentOverride ?? postDetail?.linkedinContent ?? initialLinkedinContent ?? "";
  const threadsContent = threadsContentOverride ?? postDetail?.threadsContent ?? initialThreadsContent ?? [""];
  const isContentReady = Boolean(postDetail) && !isPostDetailLoading && !isPostDetailError;

  const updatePostMutation = useUpdatePost({
    showToast: false,
    onSuccess: () => {
      toast.success("SNS 콘텐츠가 저장되었습니다.");
      setHasChanges(false);
      onUpdate?.();
    },
    onError: () => {
      toast.error("저장에 실패했습니다.");
    },
  });

  const handleLinkedinChange = (value: string) => {
    setLinkedinContentOverride(value);
    setHasChanges(true);
  };

  const handleThreadsChange = (index: number, value: string) => {
    const newContent = [...threadsContent];
    newContent[index] = value;
    setThreadsContentOverride(newContent);
    setHasChanges(true);
  };

  const handleCopyLinkedin = () => {
    navigator.clipboard.writeText(linkedinContent);
    toast.success("LinkedIn 콘텐츠가 복사되었습니다.");
  };

  const handleCopyThreadsPost = (index: number) => {
    navigator.clipboard.writeText(threadsContent[index]);
    toast.success(`Threads 포스트 ${index + 1}이 복사되었습니다.`);
  };

  const handleOpenLinkedin = () => {
    handleCopyLinkedin();
    window.open("https://www.linkedin.com/in/byungsker/overlay/create-post/", "_blank");
  };

  const handleOpenThreads = () => {
    navigator.clipboard.writeText(threadsContent[0] || "");
    toast.success("첫 번째 Threads 포스트가 복사되었습니다.");
    window.open(
      threadsUrl || postDetail?.threadsUrl || "https://www.threads.com/@byungsker_letter",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleSave = () => {
    if (!isContentReady) {
      toast.error("포스트 상세 콘텐츠를 불러오는 중입니다.");
      return;
    }

    updatePostMutation.mutate({
      id: postId,
      data: {
        linkedinContent: platform === "linkedin" ? linkedinContent : undefined,
        threadsContent: platform === "threads" ? threadsContent : undefined,
      },
    });
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("변경사항이 있습니다. 저장하지 않고 닫으시겠습니까?")) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const platformLabel = platform === "linkedin" ? "LinkedIn" : "Threads";
  const PlatformIcon = platform === "linkedin" ? LinkedInIcon : ThreadsIcon;
  const platformUrl =
    platform === "linkedin" ? linkedinUrl || postDetail?.linkedinUrl : threadsUrl || postDetail?.threadsUrl;

  const linkedinTab = (
    <div className="linkedin-content space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyLinkedin}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Copy className="h-3.5 w-3.5" />
            복사
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenLinkedin}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            LinkedIn에 포스트
          </Button>
        </div>
      </div>
      <div className="relative">
        <Textarea
          value={linkedinContent}
          onChange={(e) => handleLinkedinChange(e.target.value)}
          placeholder="LinkedIn 콘텐츠가 없습니다."
          className={cn(
            "resize-none transition-all duration-200 pr-10",
            isFullView ? "h-[calc(100dvh-280px)]" : "h-[300px]"
          )}
          disabled={updatePostMutation.isPending || !isContentReady}
        />
        {!isMobile && (
          <button
            type="button"
            onClick={() => setIsFullView(!isFullView)}
            className="absolute bottom-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={isFullView ? "축소" : "전체보기"}
          >
            {isFullView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        )}
      </div>
      <p
        className={cn(
          "text-xs text-right",
          linkedinContent.length > LINKEDIN_CHAR_LIMIT ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {formatCount(linkedinContent.length)}/{formatCount(LINKEDIN_CHAR_LIMIT)}
      </p>
    </div>
  );

  const threadsTab = (
    <div className="threads-content space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{threadsContent.length}개 포스트</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOpenThreads}
          className="h-8 px-3 text-xs gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Threads에 포스트
        </Button>
      </div>
      <div
        className={cn(
          "threads-posts space-y-4 overflow-y-auto",
          isFullView ? "max-h-[calc(100dvh-320px)]" : "max-h-[400px]"
        )}
      >
        {threadsContent.length === 0 || (threadsContent.length === 1 && !threadsContent[0]) ? (
          <div className="text-center py-8 text-muted-foreground">Threads 콘텐츠가 없습니다.</div>
        ) : (
          threadsContent.map((threadPost, index) => (
            <div key={index} className="thread-post-item space-y-2 p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">포스트 {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyThreadsPost(index)}
                  className="h-7 px-2 text-xs gap-1"
                >
                  <Copy className="h-3 w-3" />
                  복사
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  value={threadPost}
                  onChange={(e) => handleThreadsChange(index, e.target.value)}
                  placeholder={`Threads 포스트 ${index + 1}...`}
                  className={cn("resize-none pr-10", isFullView ? "h-[calc(100dvh-400px)]" : "h-[120px]")}
                  disabled={updatePostMutation.isPending || !isContentReady}
                />
                {!isMobile && (
                  <button
                    type="button"
                    onClick={() => setIsFullView(!isFullView)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={isFullView ? "축소" : "전체보기"}
                  >
                    {isFullView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <p
                className={cn(
                  "text-xs text-right",
                  threadPost.length > THREADS_CHAR_LIMIT ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {formatCount(threadPost.length)}/{formatCount(THREADS_CHAR_LIMIT)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const modalContent = platform === "linkedin" ? linkedinTab : threadsTab;

  const footerButtons = (
    <>
      {platformUrl && (
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={platformUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            게시된 포스트 보기
          </a>
        </Button>
      )}
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={handleSave}
        disabled={!hasChanges || !isContentReady || updatePostMutation.isPending}
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        {updatePostMutation.isPending ? "저장 중..." : "저장"}
      </Button>
    </>
  );

  if (isMobile || isFullView) {
    return (
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="sns-content-modal-backdrop fixed inset-0 z-40 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
            />
            <motion.div
              className="sns-content-modal-mobile fixed inset-0 z-50 flex flex-col bg-background"
              style={{ height: "100dvh", width: "100dvw" }}
              initial={{ y: isMobile ? "100%" : 0, opacity: isMobile ? 1 : 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: isMobile ? "100%" : 0, opacity: isMobile ? 1 : 0 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 300,
              }}
            >
              <header className="sns-content-modal-header flex items-center justify-between px-4 py-4 border-b safe-area-top">
                <div className="w-10" />
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PlatformIcon />
                  {platformLabel} 콘텐츠
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </header>

              <main className="sns-content-modal-content flex-1 overflow-y-auto px-4 pb-24">
                <div className="space-y-4 py-4">
                  {!isContentReady && (
                    <div
                      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
                      role="status"
                    >
                      {isPostDetailError
                        ? "포스트 상세 콘텐츠를 불러오지 못했습니다."
                        : "포스트 상세 콘텐츠를 불러오는 중입니다."}
                    </div>
                  )}
                  {modalContent}
                </div>
              </main>

              <footer className="sns-content-modal-footer fixed bottom-0 left-0 right-0 p-4 border-t bg-background safe-area-bottom">
                <div className="flex justify-end gap-2">{footerButtons}</div>
              </footer>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <PlatformIcon />
              {platformLabel} 콘텐츠
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsFullView(!isFullView)}
              className="gap-2"
            >
              {isFullView ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullView ? "축소" : "전체보기"}
            </Button>
          </div>
        </DialogHeader>

        {!isContentReady && (
          <div
            className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            role="status"
          >
            {isPostDetailError
              ? "포스트 상세 콘텐츠를 불러오지 못했습니다."
              : "포스트 상세 콘텐츠를 불러오는 중입니다."}
          </div>
        )}
        <div className="space-y-4">{modalContent}</div>

        <DialogFooter className="flex justify-end gap-2">{footerButtons}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
