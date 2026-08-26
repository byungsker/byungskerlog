"use client";

import { useState } from "react";
import { useUser } from "@stackframe/stack";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { SocialMediaContentModal } from "@/components/modals/SocialMediaContentModal";
import { ExternalLink, FileText } from "lucide-react";

interface SocialMediaLinksProps {
  linkedinUrl?: string | null;
  threadsUrl?: string | null;
  postId?: string;
  linkedinContent?: string | null;
  threadsContent?: string[];
}

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.291 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126.742a12.833 12.833 0 0 0-2.787-.13c-1.21.07-2.2.415-2.865 1.002-.684.604-1.045 1.411-.99 2.216.05.879.485 1.622 1.229 2.096.682.435 1.569.636 2.488.565 1.248-.096 2.218-.543 2.88-1.329.52-.62.86-1.467.976-2.521a4.525 4.525 0 0 1 1.065.258c1.164.438 1.957 1.217 2.362 2.31.588 1.586.621 4.013-1.569 6.127-1.82 1.755-4.093 2.549-7.156 2.582z" />
  </svg>
);

export function SocialMediaLinks({
  linkedinUrl,
  threadsUrl,
  postId,
  linkedinContent,
  threadsContent,
}: SocialMediaLinksProps) {
  const user = useUser();
  const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);
  const [threadsModalOpen, setThreadsModalOpen] = useState(false);

  const hasLinkedinData = linkedinUrl || linkedinContent;
  const hasThreadsData = threadsUrl || (threadsContent && threadsContent.length > 0 && threadsContent[0]);

  if (!hasLinkedinData && !hasThreadsData) {
    return null;
  }

  if (!user) {
    return (
      <div className="social-media-links flex items-center gap-3">
        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-[#0A66C2] transition-colors"
            title="LinkedIn에서 보기"
          >
            <LinkedInIcon />
          </a>
        )}
        {threadsUrl && (
          <a
            href={threadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Threads에서 보기"
          >
            <ThreadsIcon />
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="social-media-links flex items-center gap-3">
        {hasLinkedinData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-[#0A66C2] transition-colors" title="LinkedIn 옵션">
                <LinkedInIcon />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {linkedinUrl && (
                <DropdownMenuItem asChild>
                  <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    포스트 보러가기
                  </a>
                </DropdownMenuItem>
              )}
              {postId && (
                <DropdownMenuItem onClick={() => setLinkedinModalOpen(true)} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  콘텐츠 확인하기
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {hasThreadsData && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors" title="Threads 옵션">
                <ThreadsIcon />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {threadsUrl && (
                <DropdownMenuItem asChild>
                  <a href={threadsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    포스트 보러가기
                  </a>
                </DropdownMenuItem>
              )}
              {postId && (
                <DropdownMenuItem onClick={() => setThreadsModalOpen(true)} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  콘텐츠 확인하기
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {postId && (
        <>
          {linkedinModalOpen && (
            <SocialMediaContentModal
              open
              onOpenChange={setLinkedinModalOpen}
              postId={postId}
              platform="linkedin"
              linkedinContent={linkedinContent}
              threadsContent={threadsContent}
              linkedinUrl={linkedinUrl}
              threadsUrl={threadsUrl}
            />
          )}
          {threadsModalOpen && (
            <SocialMediaContentModal
              open
              onOpenChange={setThreadsModalOpen}
              postId={postId}
              platform="threads"
              linkedinContent={linkedinContent}
              threadsContent={threadsContent}
              linkedinUrl={linkedinUrl}
              threadsUrl={threadsUrl}
            />
          )}
        </>
      )}
    </>
  );
}
