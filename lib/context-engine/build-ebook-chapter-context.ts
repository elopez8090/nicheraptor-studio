import type { SupabaseClient } from "@supabase/supabase-js";

import {
  formatLibrarySnippetsBlock,
  formatPriorChaptersSummaryBlock,
  formatProjectMemoryBlock,
  formatProjectNotesBlock,
} from "@/lib/ai-memory/format-memory-for-prompt";
import { fetchFavoriteLibrarySnippets } from "@/lib/ai-memory/library-snippets";
import { fetchPriorChapterSummaries } from "@/lib/ai-memory/chapter-summaries-db";
import { fetchEbookProjectMemory } from "@/lib/ai-memory/project-memory-db";
import {
  syncEbookProjectMemoryFromSettings,
  type EbookProjectMemorySource,
} from "@/lib/ai-memory/sync-memory-from-project";
import { ensurePriorChapterSummaries } from "@/lib/ai-memory/ensure-chapter-summaries";
import { fetchProjectNotes, isProjectNotesSchemaMissing } from "@/lib/notes/project-notes-db";
import type { ChapterGenerationContext } from "@/lib/ebooks/build-chapter-generation-prompt";
import {
  analyzeWritingConsistency,
  formatConsistencyGuidanceBlock,
  plainTextFromChapterHtml,
} from "@/lib/context-engine/consistency-engine";
import {
  buildStructureAwareness,
  formatStructureAwarenessBlock,
  type ChapterOutlineRow,
} from "@/lib/context-engine/chapter-relationships";

export type EbookChapterContextExtras = {
  projectMemoryBlock?: string;
  priorChaptersSummaryBlock?: string;
  projectNotesBlock?: string;
  librarySnippetsBlock?: string;
  structureAwarenessBlock?: string;
  consistencyGuidanceBlock?: string;
  continuityInstructionsBlock?: string;
};

export type BuiltEbookChapterContext = ChapterGenerationContext &
  EbookChapterContextExtras;

export async function buildEbookChapterGenerationContext(input: {
  supabase: SupabaseClient;
  apiKey: string;
  userId: string;
  projectId: string;
  chapterId: string;
  baseContext: ChapterGenerationContext;
  chapterPosition: number;
  allChapters: ChapterOutlineRow[];
  priorChapterContents: Array<{ content: string | null }>;
  projectMeta?: EbookProjectMemorySource;
}): Promise<BuiltEbookChapterContext> {
  const { supabase, apiKey, projectId, baseContext, chapterPosition, chapterId } =
    input;

  await syncEbookProjectMemoryFromSettings(supabase, {
    userId: input.userId,
    projectId,
    project: input.projectMeta ?? {
      title: baseContext.ebookTitle,
      audience: baseContext.audience,
      goal: baseContext.goal,
      writing_style: baseContext.writingStyle,
      human_score: baseContext.humanScore,
    },
  });

  if (chapterPosition > 1) {
    await ensurePriorChapterSummaries(
      supabase,
      apiKey,
      projectId,
      chapterPosition,
    );
  }

  const [memory, priorSummaries, notes, snippets] = await Promise.all([
    fetchEbookProjectMemory(supabase, projectId),
    fetchPriorChapterSummaries(supabase, projectId, chapterPosition),
    fetchProjectNotes(supabase, projectId).catch((err) => {
      if (
        err instanceof Error &&
        isProjectNotesSchemaMissing(err.message)
      ) {
        return [];
      }
      return [];
    }),
    fetchFavoriteLibrarySnippets(supabase, input.userId, 3),
  ]);

  const priorSlices = priorSummaries.map((s) => ({
    position: s.position,
    title: s.title,
    summary: s.summary,
    keyConcepts: s.keyConcepts,
  }));

  const explainedTopics = priorSummaries.flatMap((s) => s.explainedTopics);
  const structure = buildStructureAwareness({
    chapters: input.allChapters,
    currentPosition: chapterPosition,
    priorExplainedTopics: explainedTopics,
  });

  const terminologyFromMemory =
    memory?.memory.terminology?.map((t) => t.term) ?? [];
  const terminologyFromSummaries = priorSummaries.flatMap((s) =>
    s.terminology.map((t) => t.term),
  );

  const priorPlain = input.priorChapterContents
    .map((c) => plainTextFromChapterHtml(c.content))
    .filter(Boolean);

  const consistency = analyzeWritingConsistency({
    priorChapterPlainTexts: priorPlain,
    projectTerminology: [
      ...terminologyFromMemory,
      ...terminologyFromSummaries,
    ],
    expectedToneKeywords: baseContext.writingStyle
      ? [String(baseContext.writingStyle)]
      : undefined,
  });

  const relevantNotes = notes
    .filter((n) => !n.chapterId || n.chapterId === chapterId)
    .slice(0, 8);

  const continuityInstructionsBlock =
    chapterPosition > 1
      ? `Chapter continuity:
- Bridge from the prior chapter without repeating its explanations.
- Reference earlier concepts only when this chapter needs them.
- Do not duplicate ideas already covered in prior chapter summaries.`
      : undefined;

  return {
    ...baseContext,
    projectMemoryBlock: formatProjectMemoryBlock(memory),
    priorChaptersSummaryBlock: formatPriorChaptersSummaryBlock(priorSlices),
    projectNotesBlock: formatProjectNotesBlock(
      relevantNotes.map((n) => ({
        title: n.title,
        body: n.body,
        tag: n.tag,
      })),
    ),
    librarySnippetsBlock: formatLibrarySnippetsBlock(snippets),
    structureAwarenessBlock: formatStructureAwarenessBlock(structure),
    consistencyGuidanceBlock: formatConsistencyGuidanceBlock(consistency),
    continuityInstructionsBlock,
  };
}
