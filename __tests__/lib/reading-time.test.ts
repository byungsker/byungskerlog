import { describe, it, expect } from "vitest";
import { calculateReadingTime } from "@/lib/reading-time";

describe("calculateReadingTime", () => {
  describe("빈 콘텐츠 처리", () => {
    it("should return 1 minute for empty content", () => {
      expect(calculateReadingTime("")).toBe("약 1분");
    });

    it("should return 1 minute for null/undefined content", () => {
      expect(calculateReadingTime(null as unknown as string)).toBe("약 1분");
      expect(calculateReadingTime(undefined as unknown as string)).toBe("약 1분");
    });
  });

  describe("영문 콘텐츠", () => {
    it("should calculate reading time for short English text", () => {
      // 200 words per minute, so 100 words = ~1 min
      const words = "word ".repeat(100);
      const result = calculateReadingTime(words);
      expect(result).toBe("약 1분");
    });

    it("should calculate reading time for longer English text", () => {
      // 400 words should be ~2 min at 200 words/min
      const words = "word ".repeat(400);
      const result = calculateReadingTime(words);
      expect(result).toBe("약 2분");
    });

    it("should round up reading time", () => {
      // 250 words should round up to 2 min
      const words = "word ".repeat(250);
      const result = calculateReadingTime(words);
      expect(result).toBe("약 2분");
    });
  });

  describe("한글 콘텐츠", () => {
    it("should calculate reading time for Korean text", () => {
      // 400 chars per minute, so 200 chars = ~1 min
      const koreanText = "가".repeat(200);
      const result = calculateReadingTime(koreanText);
      expect(result).toBe("약 1분");
    });

    it("should calculate reading time for longer Korean text", () => {
      // 800 Korean chars should be ~2 min at 400 chars/min
      const koreanText = "한글".repeat(400);
      const result = calculateReadingTime(koreanText);
      expect(result).toBe("약 2분");
    });
  });

  describe("혼합 콘텐츠", () => {
    it("should handle mixed Korean and English content", () => {
      // 200 English words (1 min) + 400 Korean chars (1 min) = 2 min
      const englishWords = "word ".repeat(200);
      const koreanChars = "가".repeat(400);
      const result = calculateReadingTime(englishWords + koreanChars);
      expect(result).toBe("약 2분");
    });
  });

  describe("마크다운 제거", () => {
    it("should exclude code blocks from calculation", () => {
      const content = "Short text\n```javascript\nconst x = 1;\nconst y = 2;\n```";
      const result = calculateReadingTime(content);
      expect(result).toBe("약 1분");
    });

    it("should exclude inline code from calculation", () => {
      const content = "Use `npm install package-name-here` command";
      const result = calculateReadingTime(content);
      expect(result).toBe("약 1분");
    });

    it("should exclude images from calculation", () => {
      const content = "Text ![image](url.png) more text";
      const result = calculateReadingTime(content);
      expect(result).toBe("약 1분");
    });

    it("should keep link text but exclude URLs", () => {
      const content = "Visit [this link](https://example.com/very/long/url/path)";
      const result = calculateReadingTime(content);
      expect(result).toBe("약 1분");
    });

    it("should remove markdown symbols", () => {
      const content = "# Header\n## Subheader\n**bold** *italic* ~~strike~~";
      const result = calculateReadingTime(content);
      expect(result).toBe("약 1분");
    });
  });

  describe("최소 읽기 시간", () => {
    it("should always return at least 1 minute", () => {
      const result = calculateReadingTime("Hi");
      expect(result).toBe("약 1분");
    });
  });
});
