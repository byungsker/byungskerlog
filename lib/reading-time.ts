export function calculateReadingTime(content: string): string {
  if (!content) return "약 1분";

  // Remove markdown syntax for more accurate counting
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/`[^`]+`/g, "") // Remove inline code
    .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links but keep text
    .replace(/[#*_~`]/g, "") // Remove markdown symbols
    .replace(/\n+/g, " "); // Replace newlines with spaces

  // Count Korean characters (Hangul syllables)
  const koreanChars = (cleanContent.match(/[\uAC00-\uD7A3]/g) || []).length;

  // Count English words
  const englishWords = cleanContent
    .replace(/[\uAC00-\uD7A3]/g, "") // Remove Korean
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Reading speed
  const KOREAN_CHARS_PER_MINUTE = 400;
  const ENGLISH_WORDS_PER_MINUTE = 200;

  // Calculate reading time in minutes
  const koreanMinutes = koreanChars / KOREAN_CHARS_PER_MINUTE;
  const englishMinutes = englishWords / ENGLISH_WORDS_PER_MINUTE;
  const totalMinutes = Math.ceil(koreanMinutes + englishMinutes);

  // Ensure at least 1 minute
  const readingMinutes = Math.max(1, totalMinutes);

  return `약 ${readingMinutes}분`;
}
