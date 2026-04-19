import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Link from "next/link";
import { Separator } from "@/components/ui/Separator";
import { cn } from "@/lib/utils";
import { TableOfContents } from "./Toc";
import { MobileToc } from "./MobileToc";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ViewTracker } from "@/components/analytics/ViewTracker";
import { ReadingTracker } from "@/components/analytics/ReadingTracker";
import { PostActions } from "./PostActions";
import { ReadingProgress } from "./ReadingProgress";
import { AdSense } from "@/components/seo/Adsense";
import { Giscus } from "./Giscus";

import { ArrowLeft, ArrowRight, BookOpen, FileText, Zap } from "lucide-react";
import { ShortPostsNav } from "@/components/short-post/ShortPostsNav";
import { SocialMediaLinks } from "./SocialMediaLinks";
import { ThumbnailImage } from "./ThumbnailImage";
import { PostImageGallery } from "./PostImageGallery";
import { calculateReadingTime } from "@/lib/reading-time";
import { StructuredData } from "@/components/seo/StructuredData";
import { PostCacheHydrator } from "./PostCacheHydrator";
import type { Post, SeriesPost, RelatedPost, PrevNextPost } from "@/lib/post-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://byungskerlog.vercel.app";

const SHORT_AD_CONTENT_THRESHOLD = 300;

function getPlainTextLength(content: string): number {
  return content
    .replace(/[#*`~>\[\]()!\-_]/g, "")
    .replace(/\s+/g, " ")
    .trim().length;
}

interface PostDetailProps {
  post: Post;
  slug: string;
  seriesPosts: SeriesPost[];
  prevPost: PrevNextPost;
  nextPost: PrevNextPost;
  relatedPosts: RelatedPost[];
  prevShortPost: PrevNextPost;
  nextShortPost: PrevNextPost;
  isFromShort: boolean;
}

export function PostDetail({
  post,
  slug,
  seriesPosts,
  prevPost,
  nextPost,
  relatedPosts,
  prevShortPost,
  nextShortPost,
  isFromShort,
}: PostDetailProps) {
  const currentSeriesIndex = seriesPosts.findIndex((p) => p.slug === post.slug);
  const basePath = isFromShort ? "/short" : "/posts";
  const backLink = isFromShort ? "/short-posts" : "/posts";
  const backLabel = isFromShort ? "Short" : "Post";
  const adsEnabled = post.type !== "SHORT" || getPlainTextLength(post.content) >= SHORT_AD_CONTENT_THRESHOLD;

  return (
    <div className="bg-background">
      <PostCacheHydrator post={post} />
      <ReadingProgress />
      {post.type !== "SHORT" && <MobileToc content={post.content} />}
      <StructuredData
        type="article"
        data={{
          title: `${post.title} written by Byungsker`,
          description: post.excerpt || post.content.replace(/[#*`\n]/g, "").substring(0, 200) + "...",
          image: post.thumbnail || `${siteUrl}/og-image.png`,
          slug: post.slug,
          datePublished: post.createdAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          tags: post.tags || [],
        }}
      />
      <ViewTracker slug={slug} />
      <ReadingTracker slug={slug} postType={post.type} />
      <div className="post-detail-layout relative py-12">
        <div className="post-content-center flex justify-center px-4 sm:px-6 lg:px-8">
          <div className={cn("post-main-content max-w-5xl w-full", post.type !== "SHORT" && "xl:pr-24")}>
            {adsEnabled && (
              <AdSense
                adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_TOP || ""}
                adFormat="fluid"
                adLayoutKey="-fb+5w+4e-db+86"
                className="mb-8"
              />
            )}

            <Link
              href={backLink}
              className="back-to-posts inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>

            <article>
              <header className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4 leading-tight">
                  {post.title}
                </h1>
                <div className="post-header-meta flex gap-4 flex-col">
                  <div className="post-dates flex flex-col gap-1 text-muted-foreground text-sm">
                    <div className="post-created flex items-center gap-2 flex-wrap">
                      <span>작성:</span>
                      <time dateTime={post.createdAt.toISOString()}>
                        {format(new Date(post.createdAt), "MMMM d, yyyy 'at' HH:mm")}
                      </time>
                      <span className="hidden sm:inline">·</span>
                      <span>{calculateReadingTime(post.content)}</span>
                    </div>
                    <div className="post-updated flex items-center gap-2">
                      <span>최종 수정:</span>
                      <time dateTime={post.updatedAt.toISOString()}>
                        {format(new Date(post.updatedAt), "MMMM d, yyyy 'at' HH:mm")}
                      </time>
                    </div>
                  </div>
                  <PostActions
                    postId={post.id}
                    postTitle={post.title}
                    postSlug={post.slug}
                    postSubSlug={post.subSlug}
                  />
                  {post.series && (
                    <div className="series-badge flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm text-emerald-500 font-medium">{post.series.name}</span>
                    </div>
                  )}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {post.type === "SHORT" &&
                    (post.linkedinUrl ||
                      post.threadsUrl ||
                      post.linkedinContent ||
                      (post.threadsContent && post.threadsContent.length > 0)) && (
                      <SocialMediaLinks
                        linkedinUrl={post.linkedinUrl}
                        threadsUrl={post.threadsUrl}
                        postId={post.id}
                        linkedinContent={post.linkedinContent}
                        threadsContent={post.threadsContent}
                      />
                    )}
                </div>
              </header>

              <Separator className="my-8" />

              <PostImageGallery>
                {post.thumbnail && !post.thumbnail.includes("og-image") && (
                  <ThumbnailImage src={post.thumbnail} alt={post.title} />
                )}

                <MarkdownRenderer content={post.content} />
              </PostImageGallery>
            </article>

            {adsEnabled && (
              <AdSense
                adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_MIDDLE || ""}
                adFormat="fluid"
                adLayoutKey="-fb+5w+4e-db+86"
                className="my-8"
              />
            )}

            {post.series && seriesPosts.length > 0 && (
              <>
                <Separator className="my-12" />
                <section className="series-section">
                  <div className="series-header flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">{post.series.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      ({currentSeriesIndex + 1}/{seriesPosts.length})
                    </span>
                  </div>
                  <Card className="bg-muted/30">
                    <CardContent className="p-4">
                      <ul className="series-list space-y-2">
                        {seriesPosts.map((seriesPost, index) => (
                          <li key={seriesPost.slug}>
                            <Link
                              href={`${basePath}/${seriesPost.slug}`}
                              className={`series-item flex items-center gap-3 py-2 px-3 rounded-md transition-colors ${
                                seriesPost.slug === post.slug
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "hover:bg-muted"
                              }`}
                            >
                              <span className="series-index text-sm text-muted-foreground w-6">{index + 1}.</span>
                              <span className="series-title line-clamp-1">{seriesPost.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}

            {(post.linkedShortPost || post.linkedLongPost) && (
              <>
                <Separator className="my-12" />
                <section className="linked-post-section">
                  {post.type === "LONG" && post.linkedShortPost && (
                    <Link href={`/short/${post.linkedShortPost.slug}`} className="group block">
                      <Card className="transition-colors hover:border-primary bg-gradient-to-r from-amber-500/5 to-orange-500/5 border-amber-500/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 mb-2">
                            <Zap className="h-4 w-4" />
                            <span className="font-medium">Short 버전으로 읽기</span>
                          </div>
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {post.linkedShortPost.title}
                          </CardTitle>
                          <CardDescription>이 글의 핵심 내용을 빠르게 확인하세요</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  )}
                  {post.type === "SHORT" && post.linkedLongPost && (
                    <Link href={`/posts/${post.linkedLongPost.slug}`} className="group block">
                      <Card className="transition-colors hover:border-primary bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border-blue-500/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">전체 글 보기</span>
                          </div>
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {post.linkedLongPost.title}
                          </CardTitle>
                          <CardDescription>더 자세한 내용을 확인하세요</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  )}
                </section>
              </>
            )}

            <Separator className="my-12" />
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevPost ? (
                <Link href={`${basePath}/${prevPost.slug}`} className="group">
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        이전 글
                      </div>
                      <CardTitle className="text-base group-hover:text-primary transition-colors">
                        {prevPost.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <div />
              )}
              {nextPost ? (
                <Link href={`${basePath}/${nextPost.slug}`} className="group">
                  <Card className="h-full transition-colors hover:border-primary">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-end text-sm text-muted-foreground mb-2">
                        다음 글
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </div>
                      <CardTitle className="text-base text-right group-hover:text-primary transition-colors">
                        {nextPost.title}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ) : (
                <div />
              )}
            </nav>

            {relatedPosts.length > 0 && (
              <>
                <Separator className="my-12" />
                <section>
                  <h2 className="text-2xl font-bold mb-6">연관 글</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {relatedPosts.map((relatedPost) => (
                      <Link key={relatedPost.slug} href={`${basePath}/${relatedPost.slug}`} className="group">
                        <Card className="transition-colors hover:border-primary">
                          <CardHeader>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">
                              {relatedPost.title}
                            </CardTitle>
                            {relatedPost.excerpt && (
                              <CardDescription className="line-clamp-2">{relatedPost.excerpt}</CardDescription>
                            )}
                          </CardHeader>
                          {relatedPost.tags && relatedPost.tags.length > 0 && (
                            <CardContent className="pt-0">
                              <div className="flex flex-wrap gap-2">
                                {relatedPost.tags.map((tag) => (
                                  <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              </>
            )}

            {!isFromShort && post.type === "SHORT" && (prevShortPost || nextShortPost) && (
              <ShortPostsNav prevShortPost={prevShortPost} nextShortPost={nextShortPost} />
            )}

            <Separator className="my-12" />

            {adsEnabled && (
              <AdSense
                adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST_BOTTOM || ""}
                adFormat="fluid"
                adLayoutKey="-fb+5w+4e-db+86"
                className="mt-12"
              />
            )}

            <Separator className="my-12" />

            <Giscus slug={post.slug} />
          </div>
        </div>

        {post.type !== "SHORT" && <TableOfContents content={post.content} />}
      </div>
    </div>
  );
}
