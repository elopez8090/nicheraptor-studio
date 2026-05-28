import type { SupabaseClient } from "@supabase/supabase-js";

import type { AiQualityTier } from "@/lib/ai/engine/quality-settings";
import type { ChapterGenerationContext } from "@/lib/ebooks/build-chapter-generation-prompt";
import { runChapterGeneration } from "@/lib/ebooks/run-chapter-generation";
import type { ResearchEntry } from "@/lib/research/types";

/**
 * Full-ebook generation is orchestrated client-side (job + per-chapter API calls).
 * This helper runs one chapter in the pipeline using the shared chapter generator.
 */
export type GenerateFullEbookChapterInput = {
  apiKey: string;
  supabase: SupabaseClient;
  projectId: string;
  chapterId: string;
  quality: AiQualityTier;
  context: ChapterGenerationContext;
  previousChapterContent?: string | null;
  researchEntries?: ResearchEntry[];
  includeSourceReferences?: boolean;
};

export async function generateFullEbookChapter(
  input: GenerateFullEbookChapterInput,
) {
  return runChapterGeneration({
    apiKey: input.apiKey,
    supabase: input.supabase,
    projectId: input.projectId,
    chapterId: input.chapterId,
    chapterTitle: input.context.chapterTitle,
    quality: input.quality,
    context: input.context,
    previousChapterContent: input.previousChapterContent,
    researchEntries: input.researchEntries,
    includeSourceReferences: input.includeSourceReferences,
  });
}
