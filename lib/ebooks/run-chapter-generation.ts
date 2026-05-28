import type { SupabaseClient } from "@supabase/supabase-js";

import { generateChapter } from "@/lib/ai/generators/chapter";
import type { AiQualityTier } from "@/lib/ebooks/ai-quality-settings";
import type { ChapterGenerationContext } from "@/lib/ebooks/build-chapter-generation-prompt";
import { refreshChapterSummaryAfterGeneration } from "@/lib/ai-memory/ensure-chapter-summaries";
import { appendSourcesSectionToChapterHtml } from "@/lib/research/append-sources-section";
import type { ResearchEntry } from "@/lib/research/types";

export type RunChapterGenerationInput = {
  apiKey: string;
  supabase: SupabaseClient;
  projectId: string;
  chapterId: string;
  chapterTitle: string;
  quality: AiQualityTier;
  context: ChapterGenerationContext;
  previousChapterContent?: string | null;
  researchEntries?: ResearchEntry[];
  includeSourceReferences?: boolean;
};

export type RunChapterGenerationResult = {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export async function runChapterGeneration(
  input: RunChapterGenerationInput,
): Promise<RunChapterGenerationResult> {
  const promptContext: ChapterGenerationContext = {
    ...input.context,
    includeSourceReferences: input.includeSourceReferences,
  };

  const { content: generatedHtml, usage } = await generateChapter({
    apiKey: input.apiKey,
    quality: input.quality,
    context: promptContext,
    previousChapterContent: input.previousChapterContent,
  });

  let content = generatedHtml;

  if (
    input.includeSourceReferences &&
    input.researchEntries?.length &&
    !/<h2[^>]*>\s*Sources\s*<\/h2>/i.test(content)
  ) {
    content = appendSourcesSectionToChapterHtml(content, input.researchEntries);
  }

  const { error: updateError } = await input.supabase
    .from("ebook_chapters")
    .update({
      content,
      status: "generated",
    })
    .eq("id", input.chapterId)
    .eq("project_id", input.projectId);

  if (updateError) {
    throw new Error(
      `Failed to save generated chapter: ${updateError.message}`,
    );
  }

  try {
    await refreshChapterSummaryAfterGeneration(
      input.supabase,
      input.apiKey,
      input.projectId,
      input.chapterId,
      input.chapterTitle,
      content,
    );
  } catch (summaryError) {
    console.warn("Chapter summary refresh failed:", summaryError);
  }

  return { content, usage };
}
