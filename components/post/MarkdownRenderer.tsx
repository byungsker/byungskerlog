"use client";

import { useState, useMemo, useCallback, useEffect, memo, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { createHeadingId, normalizeMarkdownContent, splitMarkdownSegments } from "@/lib/markdown-content";
import { oneDarkCustom } from "@/lib/syntax-theme";
import { cn } from "@/lib/utils";
import { LinkCard } from "@/components/common/LinkCard";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { Components } from "react-markdown";
import type { ReactElement, ReactNode } from "react";
import type { ImageData } from "./ImageLightbox";
import { useImageLightbox } from "./ImageLightboxContext";

function extractImagesFromContent(content: string): ImageData[] {
  const result: ImageData[] = [];

  const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownImgRegex.exec(content)) !== null) {
    result.push({ src: match[2], alt: match[1] || "이미지" });
  }

  const htmlImgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/gi;
  while ((match = htmlImgRegex.exec(content)) !== null) {
    const src = match[1];
    const alt = match[2] || "이미지";
    if (!result.some((img) => img.src === src)) {
      result.push({ src, alt });
    }
  }

  return result;
}

// Extract plain text from React children for heading ID generation
function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (isValidElement(children)) {
    return extractText((children.props as { children?: ReactNode }).children);
  }
  return "";
}

interface MarkdownRendererProps {
  content: string;
  reserveMobileTocSpace?: boolean;
}

interface CodeComponentProps {
  className?: string;
  children?: ReactNode;
  // inline prop은 react-markdown v8+에서 deprecated. className으로만 block/inline 구분
}

interface MarkdownContentProps {
  segments: { type: "markdown" | "url"; content: string }[];
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  reserveMobileTocSpace: boolean;
}

const MarkdownContent = memo(function MarkdownContent({
  segments,
  onClick,
  reserveMobileTocSpace,
}: MarkdownContentProps) {
  const components = createMarkdownComponents();

  return (
    <div
      className={cn(
        "article-prose prose dark:prose-invert max-w-none",
        reserveMobileTocSpace && "pr-10 md:pr-12 xl:pr-0"
      )}
      onClick={onClick}
    >
      {segments.map((segment, index) =>
        segment.type === "url" ? (
          <LinkCard key={index} url={segment.content} />
        ) : (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeSanitize]}
            components={components}
          >
            {segment.content}
          </ReactMarkdown>
        )
      )}
    </div>
  );
});

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("코드가 복사되었습니다");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
      toast.error("복사에 실패했습니다");
    }
  };

  return (
    <div className="code-block-wrapper relative my-6 group">
      <button
        onClick={handleCopy}
        className="copy-button absolute top-2 right-2 z-10 p-2 rounded-md bg-[oklch(0.15_0_0)] dark:bg-[oklch(0.3_0_0)] hover:bg-[oklch(0.2_0_0)] dark:hover:bg-[oklch(0.4_0_0)] transition-colors"
        aria-label="코드 복사"
      >
        {copied ? (
          <Check className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
        ) : (
          <Copy className="w-3 h-3 md:w-4 md:h-4" />
        )}
      </button>
      <SyntaxHighlighter
        style={oneDarkCustom}
        language={language}
        PreTag="div"
        className="syntax-highlighter rounded-lg"
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function createMarkdownComponents(): Components {
  const headingIdCounts = new Map<string, number>();

  const getHeadingId = (children: ReactNode) => {
    const baseId = createHeadingId(extractText(children));
    const count = headingIdCounts.get(baseId) ?? 0;
    headingIdCounts.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count}`;
  };

  const renderH2 = (children: ReactNode, props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      id={getHeadingId(children)}
      className="heading-h2 scroll-mt-24 mt-14 mb-5 font-bold tracking-tight leading-tight first:mt-0"
      {...props}
    >
      {children}
    </h2>
  );

  return {
    code: ({ className, children, ...props }: CodeComponentProps): ReactElement => {
      const match = /language-(\w+)/.exec(className || "");
      // language 클래스가 있으면 block code, 없으면 inline code
      if (match) {
        const codeContent = String(children).replace(/\n$/, "");
        return <CodeBlock code={codeContent} language={match[1]} />;
      }
      return (
        <code
          className={cn(
            "inline-code relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm",
            "bg-[oklch(0.97_0_0)] text-[oklch(0.45_0.15_30)]",
            "dark:bg-[oklch(0.269_0_0)] dark:text-[oklch(0.85_0.15_30)]",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    a: ({ children, href, ...props }) => (
      <a
        href={href}
        className="text-primary hover:underline font-medium transition-all break-words [overflow-wrap:anywhere]"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
        {...props}
      >
        {children}
      </a>
    ),

    img: ({ src, alt, ...props }) => {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt || ""}
          className="rounded-lg shadow-md my-6 cursor-pointer hover:opacity-90 transition-opacity"
          {...props}
        />
      );
    },
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="blockquote border-l-4 border-[oklch(0.8_0_0)] dark:border-[oklch(0.4_0_0)] pl-4 my-6 text-muted-foreground text-base md:text-lg leading-7 md:leading-8 [&>p]:my-0"
        {...props}
      >
        {children}
      </blockquote>
    ),
    br: () => <br />,
    pre: ({ children, ...props }) => (
      <pre className="p-0" {...props}>
        {children}
      </pre>
    ),
    p: ({ children, ...props }) => (
      <p className="text-base md:text-lg leading-7 md:leading-8 my-5 first:mt-0 last:mb-0" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc pl-6 my-5 space-y-2 [&>li>p]:my-0" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal pl-6 my-5 space-y-2 [&>li>p]:my-0" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-base md:text-lg leading-7 md:leading-8 [&>p]:my-0" {...props}>
        {children}
      </li>
    ),
    h1: ({ children, ...props }) => {
      return renderH2(children, props);
    },
    h2: ({ children, ...props }) => {
      return renderH2(children, props);
    },
    h3: ({ children, ...props }) => {
      const id = getHeadingId(children);
      return (
        <h3
          id={id}
          className="heading-h3 scroll-mt-24 mt-10 mb-4 font-semibold tracking-tight leading-snug first:mt-0"
          {...props}
        >
          {children}
        </h3>
      );
    },
  };
}

export function MarkdownRenderer({ content, reserveMobileTocSpace = false }: MarkdownRendererProps) {
  const { registerImages, openLightbox } = useImageLightbox();

  const processedContent = useMemo(() => {
    return normalizeMarkdownContent(content);
  }, [content]);

  const images = useMemo(() => extractImagesFromContent(content), [content]);

  useEffect(() => {
    registerImages(images, "content");
  }, [images, registerImages]);

  const handleProseClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        const imgElement = target as HTMLImageElement;
        openLightbox(imgElement.src);
      }
    },
    [openLightbox]
  );

  const segments = useMemo(() => {
    return splitMarkdownSegments(processedContent);
  }, [processedContent]);

  return (
    <MarkdownContent segments={segments} onClick={handleProseClick} reserveMobileTocSpace={reserveMobileTocSpace} />
  );
}
