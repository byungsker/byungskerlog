"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";
import { extractMarkdownHeadings } from "@/lib/markdown-content";

interface MobileTocProps {
  content: string;
}

export function MobileToc({ content }: MobileTocProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [isWithinContent, setIsWithinContent] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tocPanelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const toc = useMemo(() => extractMarkdownHeadings(content), [content]);

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = "";
      const prose = document.querySelector(".article-prose");

      if (prose) {
        const proseRect = prose.getBoundingClientRect();
        const bottomGuard = Math.min(240, window.innerHeight * 0.3);
        const nextIsWithinContent = proseRect.top < window.innerHeight - 80 && proseRect.bottom > bottomGuard;
        if (!nextIsWithinContent && isOpen) {
          (document.querySelector("article") as HTMLElement | null)?.focus({ preventScroll: true });
        }
        setIsWithinContent(nextIsWithinContent);
        if (!nextIsWithinContent) setIsOpen(false);
      } else {
        setIsWithinContent(true);
      }

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
  }, [isOpen, toc]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeItemRef.current && tocPanelRef.current) {
      const panel = tocPanelRef.current;
      const activeItem = activeItemRef.current;

      const panelRect = panel.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      if (itemRect.top < panelRect.top || itemRect.bottom > panelRect.bottom) {
        activeItem.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [activeId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    (activeItemRef.current ?? firstItemRef.current)?.focus();
  }, [isOpen]);

  const handleTocClick = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  if (toc.length === 0 || !isWithinContent) return null;

  return (
    <div
      ref={menuRef}
      className="mobile-toc-wrapper fixed z-40 xl:hidden"
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1rem + env(safe-area-inset-right, 0px))",
      }}
    >
      {isOpen && (
        <div
          id="post-mobile-toc"
          ref={tocPanelRef}
          role="navigation"
          aria-label="글 목차"
          className="floating-toc-panel absolute bottom-14 right-0 w-64 max-h-72 overflow-y-auto rounded-2xl bg-white/95 dark:bg-black/90 backdrop-blur-2xl border border-border/60 shadow-2xl p-3 origin-bottom-right"
          style={{
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
          }}
        >
          <h3 className="floating-toc-header text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            목차
          </h3>
          <ul className="space-y-1">
            {toc.map((item, index) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id} className={cn(item.level === 3 && "ml-3")}>
                  <button
                    ref={(element) => {
                      if (index === 0) firstItemRef.current = element;
                      if (isActive) activeItemRef.current = element;
                    }}
                    onClick={() => handleTocClick(item.id)}
                    className={cn(
                      "toc-item block w-full text-left text-sm py-2 px-2 rounded-lg transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {item.text}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "목차 닫기" : "목차 열기"}
        aria-expanded={isOpen}
        aria-controls="post-mobile-toc"
        className={cn(
          "mobile-toc-trigger flex items-center justify-center w-11 h-11 rounded-full bg-background/95 backdrop-blur-2xl border border-border/70 shadow-lg text-foreground transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isOpen && "bg-primary/20 text-primary"
        )}
        style={{
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        }}
      >
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}
