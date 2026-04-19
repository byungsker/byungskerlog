import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { BookDetailPageClient } from "./BookDetailPageClient";

interface BookDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getBook(slug: string) {
  return await prisma.book.findUnique({
    where: { slug },
    include: {
      posts: {
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    return {
      title: "책을 찾을 수 없습니다",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: `${book.title} | Byungskerlog`,
    description: book.summary || `${book.author}의 ${book.title}`,
    robots: { index: false, follow: true },
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const book = await getBook(slug);

  if (!book) {
    notFound();
  }

  const user = await getAuthUser();
  const isAdmin = user != null;

  return <BookDetailPageClient book={book} isAdmin={isAdmin} />;
}
