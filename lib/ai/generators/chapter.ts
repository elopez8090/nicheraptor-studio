import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import {
  getAiQualityConfig,
  type AiQualityTier,
} from "@/lib/ai/engine/quality-settings";
import { applyForbiddenPhraseFilter } from "@/lib/ai/humanization";
import { CHAPTER_GENERATION_SYSTEM_PROMPT } from "@/lib/ai/prompts/chapter-system";
import {
  buildChapterGenerationPrompt,
  extractClosingSnippet,
  type ChapterGenerationContext,
} from "@/lib/ebooks/build-chapter-generation-prompt";
import {
  DEFAULT_EBOOK_LENGTH_SETTINGS,
  resolveMaxOutputTokensForChapterLength,
} from "@/lib/ebooks/ebook-length-settings";
import { chapterContentToEditorHtml } from "@/lib/ebooks/chapter-content-for-editor";
import { stripMarkdownCodeFences } from "@/lib/ai/utilities/content";

export type GenerateChapterInput = {
  apiKey: string;
  quality: AiQualityTier;
  context: ChapterGenerationContext;
  previousChapterContent?: string | null;
  /** Apply post-generation phrase filter (default true). */
  humanizeOutput?: boolean;
};

export type GenerateChapterResult = AiGenerationResult<string> & {
  rawContent: string;
};

export async function generateChapter(
  input: GenerateChapterInput,
): Promise<GenerateChapterResult> {
  const qualityConfig = getAiQualityConfig(input.quality);

  const promptContext: ChapterGenerationContext = {
    ...input.context,
    previousChapterClosingSnippet: extractClosingSnippet(
      input.previousChapterContent,
    ),
  };

  const userPrompt = buildChapterGenerationPrompt(promptContext);
  const lengthSettings =
    promptContext.lengthSettings ?? DEFAULT_EBOOK_LENGTH_SETTINGS;
  const maxTokens = resolveMaxOutputTokensForChapterLength(
    lengthSettings.chapterLength,
    qualityConfig.maxOutputTokens,
  );

  const result = await generateText({
    apiKey: input.apiKey,
    system: CHAPTER_GENERATION_SYSTEM_PROMPT,
    user: userPrompt,
    settings: {
      model: qualityConfig.model,
      temperature: qualityConfig.temperature,
      maxTokens,
      operation: "ebook_chapter",
    },
  });

  const cleanedRaw = stripMarkdownCodeFences(result.content);
  const filteredRaw =
    input.humanizeOutput !== false
      ? applyForbiddenPhraseFilter(cleanedRaw).text
      : cleanedRaw;
  const html = chapterContentToEditorHtml(filteredRaw);

  return {
    ...result,
    content: html,
    rawContent: filteredRaw,
  };
}
