import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { format } from "date-fns";

export interface PopularPost {
  id: string;
  href: string;
  title: string;
  createdAt: Date;
}

interface PopularPostsProps {
  posts: PopularPost[];
}

export function PopularPosts({ posts }: PopularPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="popular-posts-heading" className="popular-posts-section mb-10 sm:mb-12">
      <div className="popular-posts-heading-row mb-4">
        <h1 id="popular-posts-heading" className="popular-posts-title text-2xl font-bold tracking-tight sm:text-3xl">
          많이 읽힌 글
        </h1>
      </div>

      <ol className="popular-posts-grid grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post, index) => (
          <li key={post.id} className="popular-posts-item bg-background">
            <Link
              href={post.href}
              className="popular-posts-link group flex min-h-35 flex-col justify-between p-4 transition-colors hover:bg-muted/60 sm:p-5"
            >
              <div className="popular-posts-main flex gap-4">
                <span aria-hidden="true" className="popular-posts-rank text-sm font-semibold tabular-nums text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2 className="popular-posts-post-title line-clamp-2 text-base font-semibold leading-snug group-hover:text-primary sm:text-lg">
                  {post.title}
                </h2>
              </div>
              <div className="popular-posts-meta mt-5 flex items-center justify-between gap-3 pl-8 text-xs text-muted-foreground">
                <span>{format(post.createdAt, "yyyy.MM.dd")}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
