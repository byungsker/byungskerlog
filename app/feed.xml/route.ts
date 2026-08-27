import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/site-config";

export async function GET() {
  let posts: {
    slug: string;
    title: string;
    excerpt: string | null;
    createdAt: Date;
    tags: string[];
    type: "LONG" | "SHORT";
  }[] = [];

  try {
    const rawPosts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        slug: true,
        title: true,
        excerpt: true,
        createdAt: true,
        type: true,
        tags: { select: { name: true } },
      },
    });
    posts = rawPosts.map((p) => ({
      ...p,
      tags: p.tags.map((t) => t.name),
    }));
  } catch {
    /* intentionally empty - posts defaults to [] */
  }

  const rssItems = posts
    .map((post) => {
      const pubDate = new Date(post.createdAt).toUTCString();
      const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n        ");

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/${post.type === "SHORT" ? "short" : "posts"}/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/${post.type === "SHORT" ? "short" : "posts"}/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      <pubDate>${pubDate}</pubDate>
      ${categories}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Byungsker Log</title>
    <link>${siteUrl}</link>
    <description>제품 주도 개발을 지향하는 개발자, 병스커의 기술 블로그</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/logo-byungsker.png</url>
      <title>Byungsker Log</title>
      <link>${siteUrl}</link>
    </image>
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
