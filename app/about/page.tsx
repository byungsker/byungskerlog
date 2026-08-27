import { prisma } from "@/lib/prisma";
import { MarkdownRenderer } from "@/components/post/MarkdownRenderer";
import { PostImageGallery } from "@/components/post/PostImageGallery";
import { AboutPageActions } from "@/components/pages/AboutPageActions";
import { ContributionGraph } from "@/components/analytics/ContributionGraph";
import { siteUrl } from "@/lib/site-config";

import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About | Byungsker Log",
  description:
    "제품 주도 개발을 지향하는 개발자, 병스커(Byungsker)에 대해 알아보세요. 소프트웨어 개발, 제품 개발, 스타트업에 대한 경험과 인사이트를 공유합니다.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title: "About | Byungsker Log",
    description: "제품 주도 개발을 지향하는 개발자, 병스커(Byungsker)에 대해 알아보세요.",
    url: `${siteUrl}/about`,
    type: "profile",
  },
};

async function getAboutPage() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: "about" },
    });
    return page;
  } catch (error) {
    console.error("Error fetching about page:", error);
    return null;
  }
}

export interface ContributionPost {
  id: string;
  title: string;
  slug: string;
  type: "LONG" | "SHORT";
  createdAt: string;
}

async function getContributionPosts(): Promise<ContributionPost[]> {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      type: post.type,
      createdAt: post.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching contribution posts:", error);
    return [];
  }
}

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "병스커 (Byungsker)",
  url: siteUrl,
  jobTitle: "Software Developer",
  description: "제품 주도 개발을 지향하는 소프트웨어 개발자",
  knowsAbout: ["소프트웨어 개발", "제품 개발", "스타트업", "Next.js", "React", "TypeScript"],
  sameAs: ["https://github.com/byungsker", "https://linkedin.com/in/byungsker"],
};

export default async function AboutPage() {
  const [page, contributionPosts] = await Promise.all([getAboutPage(), getContributionPosts()]);

  const title = page?.title || "About";
  const content = page?.content || "";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">{title}</h1>
            <AboutPageActions />
          </div>
          <div className="contribution-graph-section mb-8">
            <ContributionGraph posts={contributionPosts} />
          </div>
          <div className="prose prose-lg dark:prose-invert max-w-none prose-p:leading-normal prose-li:leading-normal">
            <PostImageGallery>
              <MarkdownRenderer content={content} />
            </PostImageGallery>
          </div>
        </div>
      </div>
    </>
  );
}
