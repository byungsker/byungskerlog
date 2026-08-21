"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { VisitorCount } from "@/components/analytics/VisitorCount";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser, useStackApp } from "@stackframe/stack";
import { isAdminEmail } from "@/lib/auth-allowlist";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { Button } from "@/components/ui/Button";
import { SwipeDrawer, SwipeDrawerHeader, SwipeDrawerContent } from "@/components/ui/SwipeDrawer";
import { PenSquare, LogOut, Menu, FileText, FolderOpen, ChevronDown, ChevronsRight } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const user = useUser();
  const app = useStackApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);

  const isDetailPage =
    (pathname.startsWith("/posts/") && pathname !== "/posts") ||
    (pathname.startsWith("/short/") && pathname !== "/short");

  const isScrollVisible = useScrollHeader({ threshold: 30, disabled: !isDetailPage });

  const isAuthorized = isAdminEmail(user?.primaryEmail);

  const navItems = [
    { label: "Posts", href: "/posts" },
    { label: "Shorts", href: "/short-posts" },
    { label: "Series", href: "/series" },
    { label: "Books", href: "/books" },
    { label: "Tags", href: "/tags" },
    { label: "만든 제품", href: "/products" },
    { label: "About", href: "/about" },
  ];

  const handleLogout = async () => {
    await app.signOut();
    setIsAdminMenuOpen(false);
  };

  return (
    <header
      className={cn(
        "header-wrapper sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-transform duration-300 ease-in-out",
        isDetailPage && !isScrollVisible && "-translate-y-full"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image
              src="/logo-byungsker.png"
              alt="병스커 BLOG"
              width={180}
              height={84}
              className="logo-image rounded select-none"
              style={{ width: "auto", height: "auto" }}
              priority
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </Link>

          <nav className="desktop-nav hidden items-center gap-4 md:flex lg:gap-6">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.href === "/short-posts" && pathname.startsWith("/short/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={cn(
                    "desktop-nav-link inline-flex min-h-11 min-w-11 items-center justify-center whitespace-nowrap text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            {isAuthorized && (
              <Button variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)} className="gap-2">
                관리자
                <ChevronDown className={cn("h-4 w-4 transition-transform", isAdminMenuOpen && "rotate-180")} />
              </Button>
            )}
            <VisitorCount />
            <ThemeToggle />
          </nav>

          <Button
            variant="ghost"
            size="sm"
            className="mobile-menu-trigger min-h-11 min-w-11 md:hidden"
            onClick={() => setIsOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <SwipeDrawer open={isOpen} onOpenChange={setIsOpen}>
            <SwipeDrawerHeader className="mobile-menu-header flex-row items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="mobile-menu-close min-h-11 min-w-11 gap-2"
                onClick={() => setIsOpen(false)}
              >
                <ChevronsRight className="h-5 w-5" />
                접기
              </Button>
            </SwipeDrawerHeader>
            <SwipeDrawerContent>
              <div className="mobile-menu-content flex flex-col gap-4 mt-4">
                <div className="nav-section flex flex-col gap-3">
                  {navItems.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`) ||
                      (item.href === "/short-posts" && pathname.startsWith("/short/"));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "mobile-nav-link inline-flex min-h-11 min-w-11 items-center px-4 py-2 text-lg font-medium transition-colors hover:text-primary",
                          isActive ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {isAuthorized && (
                  <div className="admin-section flex flex-col gap-2 py-4 border-t">
                    <Button asChild variant="default" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/write" className="gap-2 w-full justify-start">
                        <PenSquare className="h-4 w-4" />
                        글쓰기
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/drafts" className="gap-2 w-full justify-start">
                        <FileText className="h-4 w-4" />
                        임시저장
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="default" onClick={() => setIsOpen(false)}>
                      <Link href="/admin/posts" className="gap-2 w-full justify-start">
                        <FolderOpen className="h-4 w-4" />
                        포스트 관리
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="default"
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="gap-2 w-full justify-start"
                    >
                      <LogOut className="h-4 w-4" />
                      로그아웃
                    </Button>
                  </div>
                )}

                <div className="visitor-section flex items-center justify-between py-4 border-t px-4">
                  <VisitorCount />
                  <ThemeToggle />
                </div>
              </div>
            </SwipeDrawerContent>
          </SwipeDrawer>
        </div>
      </div>

      {isAuthorized && isAdminMenuOpen && (
        <div className="admin-sub-gnb hidden md:block border-t border-border/40 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto flex h-12 items-center gap-4">
              <Button asChild variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(false)}>
                <Link href="/admin/write" className="gap-2">
                  <PenSquare className="h-4 w-4" />
                  글쓰기
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(false)}>
                <Link href="/admin/drafts" className="gap-2">
                  <FileText className="h-4 w-4" />
                  임시저장
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm" onClick={() => setIsAdminMenuOpen(false)}>
                <Link href="/admin/posts" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  포스트 관리
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
