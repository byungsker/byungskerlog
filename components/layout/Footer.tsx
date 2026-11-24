"use client";

import Image from "next/image";
import Link from "next/link";
import { siteConfig, socialLinks } from "@/lib/site-config";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterGroup {
  title: string;
  links: FooterLink[];
}

const footerGroups: FooterGroup[] = [
  {
    title: "콘텐츠",
    links: [
      { label: "Posts", href: "/posts" },
      { label: "Shorts", href: "/short-posts" },
      { label: "Series", href: "/series" },
      { label: "Books", href: "/books" },
    ],
  },
  {
    title: "둘러보기",
    links: [
      { label: "Tags", href: "/tags" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "사이트",
    links: [
      { label: "Portfolio", href: "https://byungsker.com/", external: true },
      { label: "의뢰하기", href: "https://lab.byungsker.com/", external: true },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer border-t border-border bg-background">
      <div className="footer-frame mx-auto py-10">
        <div className="footer-main">
          <div className="footer-brand">
            <Link
              href="/"
              aria-label="병스커로그 홈"
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              onDragStart={(event) => event.preventDefault()}
              className="inline-flex select-none items-center"
            >
              <Image
                src="/logo-byungsker.png"
                alt=""
                width={180}
                height={84}
                className="h-8 w-auto select-none"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onDragStart={(event) => event.preventDefault()}
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              프로덕트 엔지니어 병스커의 개발 블로그
            </p>
          </div>

          {footerGroups.map((group) => (
            <section key={group.title} className="footer-group">
              <h2>{group.title}</h2>
              <nav aria-label={group.title}>
                {group.links.map((item) =>
                  item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-8 items-center hover:text-foreground"
                    >
                      {item.label}<span className="ml-1" aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <Link key={item.href} href={item.href} className="inline-flex min-h-8 items-center hover:text-foreground">
                      {item.label}
                    </Link>
                  )
                )}
              </nav>
            </section>
          ))}

          <section className="footer-group footer-contact">
            <h2>연락</h2>
            <a className="footer-email" href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>
            <nav className="social-links" aria-label="소셜 링크">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={link.label}
                >
                  <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <use href={`/assets/social-icons.svg#${link.icon}`} />
                  </svg>
                </a>
              ))}
            </nav>
          </section>
        </div>

        <div className="footer-bottom">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="법적 안내">
            <Link href="/privacy" className="hover:text-foreground">개인정보처리방침</Link>
            <Link href="/terms" className="hover:text-foreground">이용약관</Link>
          </nav>
          <small>© {currentYear} byungsker. All rights reserved.</small>
        </div>
      </div>
    </footer>
  );
}
