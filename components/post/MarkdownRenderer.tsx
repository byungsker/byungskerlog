"use client";

import { useState, useMemo, useCallback, useEffect, memo, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
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

// 헤딩 텍스트를 ID로 변환하는 함수
function generateHeadingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "");
}

// 마크다운 볼드/이탤릭 패턴 및 list item 직렬화 버그 수정
function fixBoldItalicMarkdown(content: string): string {
  return (
    content
      // list item 직렬화 버그: -**text** → - **text** (공백 누락 수정)
      .replace(/^(\s*)-(\*{1,2}\S)/gm, "$1- $2")
      // **text ** → **text** (닫는 ** 앞 공백 제거)
      .replace(/\*\*(\S[^*]*?)\s+\*\*/g, "**$1**")
      // ** text** → **text** (여는 ** 뒤 공백 제거)
      .replace(/\*\*\s+([^*]*?\S)\*\*/g, "**$1**")
      // *text * → *text* (이탤릭)
      .replace(/\*(\S[^*]*?)\s+\*/g, "*$1*")
      .replace(/\*\s+([^*]*?\S)\*/g, "*$1*")
      // CommonMark 엣지케이스: **"text"** 처럼 따옴표로 감싸진 볼드 파싱 실패 보완
      // remark가 구두점 boundary에서 right-flanking 조건을 만족하지 못하는 케이스를 HTML로 우회
      .replace(/\*\*([""'][^*\n]+[""'])\*\*/g, (_, inner) => `<strong>${inner}</strong>`)
  );
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

// 헤딩 처리: DB에 HTML 형식으로 저장된 heading을 markdown 형식으로 변환
// (custom h1/h2/h3 컴포넌트가 ID를 직접 생성하므로 HTML 변환 불필요)
function preprocessHeadings(content: string): string {
  // DB에 저장된 HTML heading 태그를 markdown ATX heading으로 변환
  // 예: <h2 id="..." class="...">텍스트</h2> → ## 텍스트
  // 앞뒤에 \n\n 보장 → 헤딩과 인접 텍스트가 붙어서 렌더링되는 버그 방지
  return content.replace(/<h([1-3])[^>]*>(.*?)<\/h\1>/gi, (_, level, innerText) => {
    const text = innerText.replace(/<[^>]*>/g, "").trim();
    return "\n\n" + "#".repeat(parseInt(level)) + " " + text + "\n\n";
  });
}

interface MarkdownRendererProps {
  content: string;
}

interface CodeComponentProps {
  className?: string;
  children?: ReactNode;
  // inline prop은 react-markdown v8+에서 deprecated. className으로만 block/inline 구분
}

const URL_LINE_REGEX = /^(https?:\/\/[^\s]+)$/;

interface MarkdownContentProps {
  segments: { type: "markdown" | "url"; content: string }[];
  components: Components;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const MarkdownContent = memo(function MarkdownContent({ segments, components, onClick }: MarkdownContentProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none" onClick={onClick}>
      {segments.map((segment, index) =>
        segment.type === "url" ? (
          <LinkCard key={index} url={segment.content} />
        ) : (
          <ReactMarkdown
            key={index}
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeRaw]}
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
        aria-label="Copy code"
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

const markdownComponents: Components = {
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
      className="text-primary hover:underline font-medium transition-all"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      {...props}
    >
      {children}
    </a>
  ),

  // eslint-disable-next-line @next/next/no-img-element
  img: ({ src, alt, ...props }) => (
    <img
      src={src}
      alt={alt || ""}
      className="rounded-lg shadow-md my-6 cursor-pointer hover:opacity-90 transition-opacity"
      {...props}
    />
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="blockquote border-l-4 border-[oklch(0.8_0_0)] dark:border-[oklch(0.4_0_0)] pl-4 italic my-4 text-muted-foreground text-base md:text-lg leading-7 md:leading-9 [&>p]:my-0"
      {...props}
    >
      {children}
    </blockquote>
  ),
  br: () => <br className="my-2" />,
  pre: ({ children, ...props }) => (
    <pre className="p-0" {...props}>
      {children}
    </pre>
  ),
  p: ({ children, ...props }) => (
    <p className="text-base md:text-lg leading-7 md:leading-9 mt-2 mb-2" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="list-disc pl-6 my-2 [&>li]:my-0.5 [&>li>p]:my-0" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="list-decimal pl-6 my-2 [&>li]:my-0.5 [&>li>p]:my-0" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-base md:text-lg leading-7 md:leading-9 my-0.5 [&>p]:my-0" {...props}>
      {children}
    </li>
  ),
  h1: ({ children, ...props }) => {
    const id = generateHeadingId(extractText(children));
    return (
      <h1 id={id} className="heading-h1 scroll-mt-24" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }) => {
    const id = generateHeadingId(extractText(children));
    return (
      <h2 id={id} className="heading-h2 scroll-mt-24" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }) => {
    const id = generateHeadingId(extractText(children));
    return (
      <h3 id={id} className="heading-h3 scroll-mt-24" {...props}>
        {children}
      </h3>
    );
  },
};

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { registerImages, openLightbox } = useImageLightbox();

  const processedContent = useMemo(() => {
    const fixedBold = fixBoldItalicMarkdown(content);
    return preprocessHeadings(fixedBold);
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
    const lines = processedContent.split("\n");
    const result: { type: "markdown" | "url"; content: string }[] = [];
    let markdownBuffer: string[] = [];
    let inCodeBlock = false;
    let codeBlockFence = "";

    const flushMarkdown = () => {
      if (markdownBuffer.length > 0) {
        result.push({ type: "markdown", content: markdownBuffer.join("\n") });
        markdownBuffer = [];
      }
    };

    for (const line of lines) {
      // 코드블록 상태 추적 (``` 또는 ~~~)
      const fenceMatch = line.trim().match(/^(`{3,}|~{3,})/);
      if (fenceMatch) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockFence = fenceMatch[1];
        } else if (line.trim().startsWith(codeBlockFence)) {
          inCodeBlock = false;
          codeBlockFence = "";
        }
      }

      const trimmed = line.trim();
      // 코드블록 안에 있는 URL은 LinkCard로 분리하지 않음
      if (!inCodeBlock && URL_LINE_REGEX.test(trimmed)) {
        flushMarkdown();
        result.push({ type: "url", content: trimmed });
      } else {
        markdownBuffer.push(line);
      }
    }
    flushMarkdown();

    return result;
  }, [processedContent]);

  return <MarkdownContent segments={segments} components={markdownComponents} onClick={handleProseClick} />;
}
