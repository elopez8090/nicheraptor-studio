import type { SupabaseClient } from "@supabase/supabase-js";

import {
  chapterContentCacheHash,
  generateChapterSummaryFromContent,
} from "@/lib/ai-memory/generate-chapter-summary";
import {
  fetchChapterSummary,
  upsertChapterSummary,
} from "@/lib/ai-memory/chapter-summaries-db";
import { isProjectAiMemorySchemaMissing } from "@/lib/ai-memory/schema";

type ChapterRow = {
  id: string;
  position: number;
  title: string;
  content: string | null;
  status: string;
};

/**
 * Ensures compact summaries exist for generated chapters before the current position.
 * Skips work when content hash matches cached summary.
 */
export async function ensurePriorChapterSummaries(
  supabase: SupabaseClient,
  apiKey: string,
  projectId: string,
  beforePosition: number,
): Promise<void> {
  const { data: chapters, error } = await supabase
    .from("ebook_chapters")
    .select("id, position, title, content, status")
    .eq("project_id", projectId)
    .lt("position", beforePosition)
    .eq("status", "generated")
    .order("position", { ascending: true });

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return;
    }
    throw new Error(error.message);
  }

  const rows = (chapters ?? []) as ChapterRow[];
  for (const chapter of rows) {
    const content = chapter.content?.trim();
    if (!content) {
      continue;
    }

    const hash = chapterContentCacheHash(content);
    const existing = await fetchChapterSummary(supabase, chapter.id);
    if (existing?.contentHash === hash && existing.summary.trim()) {
      continue;
    }

    const generated = await generateChapterSummaryFromContent(apiKey, {
      chapterTitle: chapter.title,
      contentHtml: content,
    });

    await upsertChapterSummary(supabase, {
      projectId,
      chapterId: chapter.id,
      summary: generated.summary,
      keyConcepts: generated.keyConcepts,
      terminology: generated.terminology,
      explainedTopics: generated.explainedTopics,
      contentHash: hash,
    });
  }
}

export async function refreshChapterSummaryAfterGeneration(
  supabase: SupabaseClient,
  apiKey: string,
  projectId: string,
  chapterId: string,
  chapterTitle: string,
  contentHtml: string,
): Promise<void> {
  const hash = chapterContentCacheHash(contentHtml);
  const existing = await fetchChapterSummary(supabase, chapterId);
  if (existing?.contentHash === hash && existing.summary.trim()) {
    return;
  }

  const generated = await generateChapterSummaryFromContent(apiKey, {
    chapterTitle,
    contentHtml,
  });

  await upsertChapterSummary(supabase, {
    projectId,
    chapterId,
    summary: generated.summary,
    keyConcepts: generated.keyConcepts,
    terminology: generated.terminology,
    explainedTopics: generated.explainedTopics,
    contentHash: hash,
  });
}
