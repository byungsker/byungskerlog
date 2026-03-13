import Link from "next/link";
import Image from "next/image";
import { siteConfig, socialLinks } from "@/lib/site-config";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="footer-content flex flex-col gap-6">
          <div className="footer-main flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {siteConfig.name}. All rights reserved.
            </p>

            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity"
                  aria-label={link.label}
                >
                  <Image
                    src={link.icon}
                    alt={link.label}
                    width={24}
                    height={24}
                    style={{
                      filter: "brightness(0) saturate(100%) invert(35%) sepia(0%) saturate(0%) hue-rotate(0deg)",
                    }}
                  />
                </Link>
              ))}
            </div>
          </div>

          <nav
            className="footer-legal flex items-center justify-center gap-4 text-xs text-muted-foreground"
            aria-label="법적 고지"
          >
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </Link>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              문의하기
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
