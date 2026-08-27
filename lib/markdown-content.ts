import { parseEntities } from "parse-entities";

export interface MarkdownHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface MarkdownSegment {
  type: "markdown" | "url";
  content: string;
}

const URL_LINE_REGEX = /^https?:\/\/[^\s]+$/;
const OPENING_FENCE_REGEX = /^ {0,3}(`{3,}|~{3,})/;
const RAW_BLOCK_TAG_REGEX = /^<(pre|script|style|iframe|form|div|table|details|section|article|blockquote)(?:\s|>)/i;

function getOpeningFence(line: string): string | null {
  return line.match(OPENING_FENCE_REGEX)?.[1] ?? null;
}

function isClosingFence(line: string, openingFence: string): boolean {
  if (!openingFence) return false;
  const marker = openingFence[0];
  const minimumLength = openingFence.length;
  const match = line.match(/^ {0,3}(`+|~+)[\t ]*$/);
  return Boolean(match && match[1][0] === marker && match[1].length >= minimumLength);
}

function stripHeadingMarkdown(value: string): string {
  return parseEntities(
    value
      .replace(/\s+#+\s*$/, "")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/[*_~`]/g, "")
      .trim()
  );
}

function normalizeInlineEditorArtifacts(line: string): string {
  const normalized = line.replace(/^(\s*)-(\*{1,2}\S)/, "$1- $2");
  const delimiterIndexes: number[] = [];
  let inlineCodeFenceLength = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    if (normalized[index] === "`") {
      let runLength = 1;
      while (normalized[index + runLength] === "`") runLength += 1;

      if (inlineCodeFenceLength === 0) {
        inlineCodeFenceLength = runLength;
      } else if (inlineCodeFenceLength === runLength) {
        inlineCodeFenceLength = 0;
      }

      index += runLength - 1;
      continue;
    }

    if (
      inlineCodeFenceLength === 0 &&
      normalized.slice(index, index + 2) === "**" &&
      normalized[index - 1] !== "*" &&
      normalized[index + 2] !== "*" &&
      normalized[index - 1] !== "\\"
    ) {
      delimiterIndexes.push(index);
      index += 1;
    }
  }

  const replacements: Array<{ start: number; end: number; value: string }> = [];

  for (let index = 0; index + 1 < delimiterIndexes.length; index += 2) {
    const start = delimiterIndexes[index];
    const closingStart = delimiterIndexes[index + 1];
    const end = closingStart + 2;
    const inner = normalized.slice(start + 2, closingStart).replace(/^[\t ]+|[\t ]+$/g, "");
    const before = normalized[start - 1] ?? "";
    const after = normalized[end] ?? "";
    const wordCharacter = /[\p{L}\p{N}_]/u;

    // CommonMark does not close/open emphasis next to a word character.
    // Korean particles are commonly written without a separating space, so
    // convert only these plain-text runs to equivalent inline HTML.
    const useInlineHtml = (wordCharacter.test(before) || wordCharacter.test(after)) && !/[`<>\[\]]/.test(inner);

    replacements.push({
      start,
      end,
      value: useInlineHtml ? `<strong>${inner}</strong>` : `**${inner}**`,
    });
  }

  let result = normalized;
  for (const replacement of replacements.reverse()) {
    result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end);
  }

  return result;
}

export function createHeadingId(text: string): string {
  const id = text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return id || "section";
}

/**
 * Normalize only known editor serialization defects.
 *
 * This function deliberately operates one line at a time and skips fenced code,
 * so formatting repair can never consume a paragraph boundary.
 */
export function normalizeMarkdownContent(content: string): string {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  let inCodeBlock = false;
  let openingFence = "";

  return lines
    .map((line) => {
      if (inCodeBlock) {
        if (isClosingFence(line, openingFence)) {
          inCodeBlock = false;
          openingFence = "";
        }
        return line;
      }

      const fence = getOpeningFence(line);
      if (fence) {
        inCodeBlock = true;
        openingFence = fence;
        return line;
      }

      const htmlHeading = line.match(/^\s*<h([1-3])[^>]*>(.*?)<\/h\1>\s*$/i);
      if (htmlHeading) {
        const sourceLevel = Number(htmlHeading[1]);
        const level = Math.max(2, sourceLevel);
        const text = stripHeadingMarkdown(htmlHeading[2]);
        return `${"#".repeat(level)} ${text}`;
      }

      return normalizeInlineEditorArtifacts(line).replace(/^( {0,3})#(\s+)/, "$1##$2");
    })
    .join("\n");
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const normalized = normalizeMarkdownContent(content);
  const lines = normalized.split("\n");
  const headings: MarkdownHeading[] = [];
  const idCounts = new Map<string, number>();
  let inCodeBlock = false;
  let openingFence = "";

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (inCodeBlock) {
      if (isClosingFence(line, openingFence)) {
        inCodeBlock = false;
        openingFence = "";
      }
      continue;
    }

    const fence = getOpeningFence(line);
    if (fence) {
      inCodeBlock = true;
      openingFence = fence;
      continue;
    }

    const atxMatch = line.match(/^ {0,3}(#{2,3})\s+(.+?)\s*$/);
    const setextUnderline = lines[index + 1]?.match(/^ {0,3}(=+|-+)[\t ]*$/);
    const setextText =
      setextUnderline && /^ {0,3}\S/.test(line) && !/^( {0,3})(#{1,6}|>|[-+*]\s|\d+[.)]\s)/.test(line)
        ? line.trim()
        : null;

    if (!atxMatch && !setextText) continue;

    const level = atxMatch ? (atxMatch[1].length as 2 | 3) : 2;
    const text = stripHeadingMarkdown(atxMatch ? atxMatch[2] : setextText!);
    const baseId = createHeadingId(text);
    const count = idCounts.get(baseId) ?? 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    idCounts.set(baseId, count + 1);
    headings.push({ id, text, level });
  }

  return headings;
}

export function splitMarkdownSegments(content: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = [];
  let markdownBuffer: string[] = [];
  let inCodeBlock = false;
  let openingFence = "";
  let rawBlockTag = "";
  let inHtmlComment = false;

  const flushMarkdown = () => {
    if (markdownBuffer.length === 0) return;
    segments.push({ type: "markdown", content: markdownBuffer.join("\n") });
    markdownBuffer = [];
  };

  for (const line of content.split("\n")) {
    if (inCodeBlock) {
      if (isClosingFence(line, openingFence)) {
        inCodeBlock = false;
        openingFence = "";
      }
      markdownBuffer.push(line);
      continue;
    }

    const fence = getOpeningFence(line);
    if (fence) {
      inCodeBlock = true;
      openingFence = fence;
      markdownBuffer.push(line);
      continue;
    }

    const trimmed = line.trim();
    if (inHtmlComment) {
      markdownBuffer.push(line);
      if (line.includes("-->")) inHtmlComment = false;
      continue;
    }

    if (trimmed.startsWith("<!--")) {
      markdownBuffer.push(line);
      if (!trimmed.includes("-->")) inHtmlComment = true;
      continue;
    }

    if (rawBlockTag) {
      markdownBuffer.push(line);
      if (new RegExp(`</${rawBlockTag}\\s*>`, "i").test(line)) rawBlockTag = "";
      continue;
    }

    const rawBlockMatch = trimmed.match(RAW_BLOCK_TAG_REGEX);
    if (rawBlockMatch) {
      markdownBuffer.push(line);
      const tag = rawBlockMatch[1].toLowerCase();
      if (!new RegExp(`</${tag}\\s*>`, "i").test(trimmed)) rawBlockTag = tag;
      continue;
    }

    const isIndentedCode = /^( {4}|\t)/.test(line);
    if (!isIndentedCode && URL_LINE_REGEX.test(trimmed)) {
      flushMarkdown();
      segments.push({ type: "url", content: trimmed });
    } else {
      markdownBuffer.push(line);
    }
  }

  flushMarkdown();
  return segments;
}
