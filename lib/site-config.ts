// 사이트 전역 설정
export const siteConfig = {
  name: "Byungsker Log",
  description: "Byungsker의 개인 블로그",
  url: "https://byungskerlog.com",
  author: "Byungsker",

  // SNS 링크
  social: {
    github: "https://github.com/byungsker",
    linkedin: "https://linkedin.com/in/byungsker",
  },
};

// Footer용 소셜 링크 배열
export const socialLinks = [
  {
    icon: "/logo-github.svg",
    href: siteConfig.social.github,
    label: "GitHub",
  },
  {
    icon: "/logo-linkedin.svg",
    href: siteConfig.social.linkedin,
    label: "LinkedIn",
  },
];
