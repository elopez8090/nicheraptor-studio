import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { parseJsonFromModelContent } from "@/lib/ai/utilities/content";
import { hashTextForCache, stripHtmlToPlain } from "@/lib/ai-memory/content-hash";

export type GeneratedChapterSummary = {
  summary: string;
  keyConcepts: string[];
  terminology: Array<{ term: string; definition?: string }>;
  explainedTopics: string[];
};

const SUMMARY_SYSTEM = `You compress nonfiction chapter text into structured memory for later chapters.
Respond with JSON only: {"summary":"","keyConcepts":[],"terminology":[{"term":"","definition":""}],"explainedTopics":[]}.
Keep summary under 120 words. Max 8 key concepts, 6 terms, 8 explained topics. No markdown.`;

export async function generateChapterSummaryFromContent(
  apiKey: string,
  input: {
    chapterTitle: string;
    contentHtml: string;
  },
): Promise<GeneratedChapterSummary> {
  const plain = stripHtmlToPlain(input.contentHtml);
  const truncated =
    plain.length > 12_000 ? `${plain.slice(0, 12_000)}…` : plain;

  const preset = getModelPreset("chapter_summary");
  const result = await generateText({
    apiKey,
    system: SUMMARY_SYSTEM,
    user: `Chapter title: ${input.chapterTitle}\n\nChapter text:\n${truncated}`,
    settings: {
      ...preset,
      maxTokens: 600,
      temperature: 0.2,
      operation: "chapter_memory_summary",
    },
  });

  try {
    const parsed = parseJsonFromModelContent<GeneratedChapterSummary>(
      result.content,
    );
    return {
      summary: String(parsed.summary ?? "").trim(),
      keyConcepts: Array.isArray(parsed.keyConcepts)
        ? parsed.keyConcepts.map(String).filter(Boolean).slice(0, 12)
        : [],
      terminology: Array.isArray(parsed.terminology)
        ? parsed.terminology
            .filter((t) => t?.term?.trim())
            .slice(0, 10)
            .map((t) => ({
              term: t.term.trim(),
              definition: t.definition?.trim(),
            }))
        : [],
      explainedTopics: Array.isArray(parsed.explainedTopics)
        ? parsed.explainedTopics.map(String).filter(Boolean).slice(0, 12)
        : [],
    };
  } catch {
    const fallback = truncated.slice(0, 400);
    return {
      summary: fallback || `Summary of ${input.chapterTitle}.`,
      keyConcepts: [],
      terminology: [],
      explainedTopics: [],
    };
  }
}

export function chapterContentCacheHash(contentHtml: string): string {
  return hashTextForCache(stripHtmlToPlain(contentHtml));
}
