// 사이트 전역 설정
export const siteConfig = {
  name: "병스커로그",
  siteName: "byungskerlog",
  titlePrefix: "병스커로그 (Byungskerlog)",
  description: "프로덕트 엔지니어(Product Engineer) 병스커의 개발 블로그",
  url: "https://blog.byungsker.com",
  author: "Byungsker",
  contactEmail: "extreme0728@gmail.com",

  // SNS 링크
  social: {
    github: "https://github.com/byungsker",
    linkedin: "https://www.linkedin.com/in/byungsker/",
    instagram: "https://www.instagram.com/byungsker_letter/",
    threads: "https://www.threads.com/@byungsker_letter",
    youtube: "https://www.youtube.com/@byungsker",
  },
};

export const siteUrl = siteConfig.url;

export function siteTitle(pageTitle: string) {
  return `${siteConfig.titlePrefix} | ${pageTitle}`;
}

// Footer용 소셜 링크 배열
export const socialLinks = [
  {
    icon: "linkedin",
    href: siteConfig.social.linkedin,
    label: "LinkedIn",
  },
  {
    icon: "github",
    href: siteConfig.social.github,
    label: "GitHub",
  },
  {
    icon: "instagram",
    href: siteConfig.social.instagram,
    label: "Instagram",
  },
  {
    icon: "threads",
    href: siteConfig.social.threads,
    label: "Threads",
  },
  {
    icon: "youtube",
    href: siteConfig.social.youtube,
    label: "YouTube",
  },
];
