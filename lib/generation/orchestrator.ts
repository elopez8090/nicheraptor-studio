/**
 * Client-side generation orchestration.
 * Each chapter is generated via the chapter API; job state is persisted in Supabase.
 * A future worker (Inngest, Trigger.dev, Edge Function) can call the same chapter
 * processor without this loop.
 */

import type { AiQualityTier } from "@/lib/ebooks/ai-quality-settings";

import type { GenerationJobChapterPlanItem } from "./types";

export type OrchestratorChapterResult =
  | {
      ok: true;
      content: string;
      tokensUsed?: number;
    }
  | {
      ok: false;
      cancelled?: boolean;
      skipped?: boolean;
      error: string;
    };

export type RunGenerationOrchestratorOptions = {
  projectId: string;
  jobId: string;
  quality: AiQualityTier;
  chapterPlan: GenerationJobChapterPlanItem[];
  shouldCancel: () => boolean;
  generateChapter: (
    chapter: GenerationJobChapterPlanItem,
    previousChapterId: string | undefined,
  ) => Promise<OrchestratorChapterResult>;
  onChapterStarted?: (chapter: GenerationJobChapterPlanItem, index: number) => void;
  onChapterCompleted?: (
    chapter: GenerationJobChapterPlanItem,
    content: string,
    index: number,
  ) => void;
};

export type OrchestratorRunResult =
  | { status: "completed"; tokensUsed: number }
  | { status: "cancelled" }
  | { status: "failed"; chapterId: string; error: string };

export async function runGenerationOrchestrator(
  options: RunGenerationOrchestratorOptions,
): Promise<OrchestratorRunResult> {
  let accumulatedTokens = 0;
  let previousChapterId: string | undefined;

  for (let index = 0; index < options.chapterPlan.length; index++) {
    if (options.shouldCancel()) {
      return { status: "cancelled" };
    }

    const chapter = options.chapterPlan[index];
    options.onChapterStarted?.(chapter, index);

    const result = await options.generateChapter(chapter, previousChapterId);

    if (result.ok) {
      accumulatedTokens += result.tokensUsed ?? 0;
      options.onChapterCompleted?.(chapter, result.content, index);
      previousChapterId = chapter.id;
      continue;
    }

    if (result.cancelled) {
      return { status: "cancelled" };
    }

    if (result.skipped) {
      previousChapterId = chapter.id;
      continue;
    }

    return {
      status: "failed",
      chapterId: chapter.id,
      error: result.error,
    };
  }

  return { status: "completed", tokensUsed: accumulatedTokens };
}

export function generationJobsApiBase(projectId: string) {
  return `/api/generation/jobs?projectId=${encodeURIComponent(projectId)}`;
}

export function generationJobApi(jobId: string) {
  return `/api/generation/jobs/${encodeURIComponent(jobId)}`;
}
