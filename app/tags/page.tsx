import { prisma } from "@/lib/prisma";
import { TagsPageClient } from "@/components/pages/TagsPageClient";
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Tags | Byungsker Log",
  description:
    "주제별로 정리된 포스트를 태그로 찾아보세요. 소프트웨어 개발, 제품 개발, 스타트업 등 다양한 주제의 글을 탐색할 수 있습니다.",
  alternates: {
    canonical: `${siteUrl}/tags`,
  },
  openGraph: {
    title: "Tags | Byungsker Log",
    description: "주제별로 정리된 포스트를 태그로 찾아보세요.",
    url: `${siteUrl}/tags`,
  },
};

async function getAllTags() {
  try {
    const tags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: {
            posts: { where: { published: true } },
          },
        },
      },
      orderBy: {
        posts: { _count: "desc" },
      },
    });

    return tags.filter((t) => t._count.posts > 0).map((t) => ({ tag: t.name, count: t._count.posts }));
  } catch {
    return [];
  }
}

export default async function TagsPage() {
  const initialTags = await getAllTags();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Tags</h1>
        <TagsPageClient initialTags={initialTags} />
      </div>
    </div>
  );
}
