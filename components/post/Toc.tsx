"use client";

import { useEffect, useSyncExternalStore, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { extractMarkdownHeadings } from "@/lib/markdown-content";

const CONTENT_MAX_WIDTH = 768;
const TOC_WIDTH = 280;
const GAP = 48;

function getSnapshot() {
  return window.innerWidth;
}

function getServerSnapshot() {
  return 0;
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function TableOfContents({ content }: { content: string }) {
  const [activeId, setActiveId] = useState<string>("");
  const tocContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  const viewportWidth = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const { tocLeft, isVisible } = useMemo(() => {
    if (viewportWidth === 0) {
      return { tocLeft: null, isVisible: false };
    }
    const contentRight = (viewportWidth + CONTENT_MAX_WIDTH) / 2;
    const newTocLeft = contentRight + GAP;
    const visible = newTocLeft + TOC_WIDTH <= viewportWidth - 24;
    return { tocLeft: visible ? newTocLeft : null, isVisible: visible };
  }, [viewportWidth]);

  const toc = useMemo(() => extractMarkdownHeadings(content), [content]);

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = "";

      for (const item of toc) {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 100) {
            currentActiveId = item.id;
          }
        }
      }

      if (currentActiveId) {
        setActiveId(currentActiveId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  // 활성 항목이 변경되면 TOC 내에서 자동 스크롤
  useEffect(() => {
    if (activeItemRef.current && tocContainerRef.current) {
      const container = tocContainerRef.current;
      const activeItem = activeItemRef.current;

      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      if (itemRect.top < containerRect.top || itemRect.bottom > containerRect.bottom) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeId]);

  if (toc.length === 0 || !isVisible || tocLeft === null) return null;

  return (
    <nav className="toc-nav fixed top-24 hidden xl:block" style={{ left: tocLeft, width: TOC_WIDTH }}>
      <div ref={tocContainerRef} className="toc-container p-6 max-h-[calc(100vh-8rem)] overflow-y-auto bg-transparent">
        <h2 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">목차</h2>
        <ul className="space-y-2.5">
          {toc.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li
                key={item.id}
                className={cn("transition-all duration-200", item.level === 2 && "ml-0", item.level === 3 && "ml-4")}
              >
                <a
                  ref={isActive ? activeItemRef : null}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }}
                  className={cn(
                    "block text-sm py-1.5 px-3 rounded-md transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-primary/10 text-primary font-medium "
                      : "text-muted-foreground border-l-2 border-transparent"
                  )}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
