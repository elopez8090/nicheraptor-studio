"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AI_QUALITY_TIERS,
  estimateEbookGenerationCostUsd,
  getAiQualityConfig,
  type AiQualityTier,
} from "@/lib/ebooks/ai-quality-settings";
import type { ChapterGenerationStatus } from "@/lib/ebooks/chapter-workflow-types";
import { buildGenerationChapterPlan } from "@/lib/generation/build-chapter-plan";
import {
  generationJobApi,
  generationJobsApiBase,
  runGenerationOrchestrator,
} from "@/lib/generation/orchestrator";
import { requestChapterGeneration } from "@/lib/generation/process-chapter-request";
import type { GenerationJobPublicView } from "@/lib/generation/types";

export type GenerationChapterSnapshot = {
  id: string;
  number: number;
  title: string;
  summary: string;
  status: ChapterGenerationStatus;
};

export type FullEbookGenerationPhase =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type UseFullEbookGenerationOptions = {
  projectId: string;
  ebookTitle: string;
  audience: string;
  goal: string;
  chapters: GenerationChapterSnapshot[];
  chapterIdsFilter?: string[];
  regenerateExistingChapters?: boolean;
  libraryFrameworkId?: string | null;
  onChapterGenerated?: (chapterId: string, content: string) => void;
  onFinished?: () => void;
};

const POLL_MS = 2000;

export function useFullEbookGeneration({
  projectId,
  ebookTitle: _ebookTitle,
  audience: _audience,
  goal: _goal,
  chapters,
  chapterIdsFilter,
  regenerateExistingChapters = false,
  libraryFrameworkId = null,
  onChapterGenerated,
  onFinished,
}: UseFullEbookGenerationOptions) {
  const [quality, setQuality] = useState<AiQualityTier>("balanced");
  const [phase, setPhase] = useState<FullEbookGenerationPhase>("idle");
  const [job, setJob] = useState<GenerationJobPublicView | null>(null);
  const [currentChapterNumber, setCurrentChapterNumber] = useState(0);
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string | null>(
    null,
  );
  const [completedInRun, setCompletedInRun] = useState(0);
  const [totalChapters, setTotalChapters] = useState(chapters.length);
  const [error, setError] = useState<string | null>(null);
  const [failedChapterId, setFailedChapterId] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const cancelRef = useRef(false);
  const runningRef = useRef(false);
  const jobIdRef = useRef<string | null>(null);

  const costEstimate = estimateEbookGenerationCostUsd(
    chapterIdsFilter?.length ?? chapters.length,
    quality,
  );

  const applyJobToUi = useCallback((next: GenerationJobPublicView | null) => {
    if (!next) {
      return;
    }
    setJob(next);
    setTokensUsed(next.tokensUsed);
    if (next.failedChapterId) {
      setFailedChapterId(next.failedChapterId);
    }
    if (next.status === "running" || next.status === "pending") {
      setPhase("running");
      setCurrentChapterNumber(
        next.currentStep > 0 ? next.currentStep : next.currentStep + 1,
      );
      setCurrentChapterTitle(next.currentChapterTitle);
      setCompletedInRun(next.currentStep);
      setTotalChapters(next.totalSteps);
    } else if (next.status === "completed") {
      setPhase("completed");
      setCompletedInRun(next.totalSteps);
      setTotalChapters(next.totalSteps);
      setCurrentChapterTitle(null);
    } else if (next.status === "failed") {
      setPhase("failed");
      setError(next.errorMessage ?? "Generation failed.");
      setCurrentChapterTitle(null);
    } else if (next.status === "cancelled") {
      setPhase("cancelled");
      setCurrentChapterTitle(null);
    }
  }, []);

  const refreshJobState = useCallback(async () => {
    const res = await fetch(generationJobsApiBase(projectId));
    if (!res.ok) {
      return null;
    }
    const data = (await res.json()) as {
      job?: GenerationJobPublicView | null;
      activeJob?: GenerationJobPublicView | null;
    };
    const active = data.activeJob ?? data.job ?? null;
    if (active) {
      applyJobToUi(active);
    }
    return active;
  }, [applyJobToUi, projectId]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }
    const id = window.setInterval(() => {
      void refreshJobState();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [phase, refreshJobState]);

  const cancelGeneration = useCallback(async () => {
    cancelRef.current = true;
    await fetch(generationJobsApiBase(projectId), { method: "DELETE" });
    setPhase("cancelled");
    runningRef.current = false;
    setCurrentChapterTitle(null);
  }, [projectId]);

  const runGeneration = useCallback(
    async (onlyChapterIds?: string[]) => {
      if (runningRef.current) {
        return;
      }

      const filterIds = onlyChapterIds ?? chapterIdsFilter;
      const chapterPlan = buildGenerationChapterPlan({
        chapters,
        chapterIdsFilter: filterIds,
        regenerateExistingChapters,
      });

      if (chapterPlan.length === 0) {
        setError(
          regenerateExistingChapters
            ? "No chapters to generate."
            : "All chapters already have content. Enable “Regenerate existing chapters” to rewrite them.",
        );
        return;
      }

      setError(null);
      setFailedChapterId(null);
      setCompletedInRun(0);
      cancelRef.current = false;
      runningRef.current = true;
      setPhase("running");
      setTotalChapters(chapterPlan.length);

      const startRes = await fetch(generationJobsApiBase(projectId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quality,
          regenerateExistingChapters,
          chapterIds: filterIds,
        }),
      });

      if (startRes.status === 409) {
        setError("Generation is already running for this ebook.");
        setPhase("idle");
        runningRef.current = false;
        return;
      }

      if (!startRes.ok) {
        const payload = (await startRes.json()) as { error?: string };
        setError(payload.error ?? "Could not start generation.");
        setPhase("failed");
        runningRef.current = false;
        return;
      }

      const startPayload = (await startRes.json()) as {
        job: GenerationJobPublicView;
      };
      const activeJob = startPayload.job;
      jobIdRef.current = activeJob.id;
      setJob(activeJob);
      setTotalChapters(activeJob.totalSteps);

      const result = await runGenerationOrchestrator({
        projectId,
        jobId: activeJob.id,
        quality,
        chapterPlan: activeJob.chapterPlan,
        shouldCancel: () => cancelRef.current,
        onChapterStarted: (chapter, index) => {
          setCurrentChapterNumber(index + 1);
          setCurrentChapterTitle(chapter.title);
        },
        onChapterCompleted: (chapter, content, index) => {
          setCompletedInRun(index + 1);
          onChapterGenerated?.(chapter.id, content);
        },
        generateChapter: async (chapter, previousChapterId) => {
          const gen = await requestChapterGeneration({
            projectId,
            chapter,
            quality,
            previousChapterId,
            jobId: activeJob.id,
            libraryFrameworkId,
          });
          if (gen.ok) {
            return {
              ok: true,
              content: gen.content,
              tokensUsed: gen.tokensUsed,
            };
          }
          if (gen.cancelled) {
            return { ok: false, cancelled: true, error: gen.error };
          }
          if (gen.skipped) {
            return { ok: false, skipped: true, error: gen.error };
          }
          return { ok: false, error: gen.error };
        },
      });

      if (result.status === "cancelled") {
        setPhase("cancelled");
        runningRef.current = false;
        setCurrentChapterTitle(null);
        return;
      }

      if (result.status === "failed") {
        setFailedChapterId(result.chapterId);
        setError(result.error);
        setPhase("failed");
        runningRef.current = false;
        return;
      }

      await fetch(generationJobApi(activeJob.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          tokensUsed: result.tokensUsed,
        }),
      });

      setTokensUsed(result.tokensUsed);
      setPhase("completed");
      runningRef.current = false;
      setCurrentChapterTitle(null);
      void refreshJobState();
      onFinished?.();
    },
    [
      chapterIdsFilter,
      chapters,
      onChapterGenerated,
      onFinished,
      projectId,
      quality,
      regenerateExistingChapters,
      refreshJobState,
      libraryFrameworkId,
    ],
  );

  const retryFailedChapter = useCallback(() => {
    if (!failedChapterId) {
      void runGeneration();
      return;
    }
    const failed = chapters.find((c) => c.id === failedChapterId);
    if (!failed) {
      void runGeneration();
      return;
    }
    const ids = chapters
      .filter((c) => c.number >= failed.number)
      .map((c) => c.id);
    void runGeneration(ids);
  }, [chapters, failedChapterId, runGeneration]);

  const progressPercent =
    job?.progressPercentage ??
    (totalChapters > 0
      ? Math.round((completedInRun / totalChapters) * 100)
      : 0);

  return {
    quality,
    setQuality,
    qualityOptions: AI_QUALITY_TIERS.map((tier) => getAiQualityConfig(tier)),
    costEstimate,
    phase,
    job,
    currentChapterNumber,
    currentChapterTitle,
    completedInRun,
    totalChapters,
    progressPercent,
    error,
    failedChapterId,
    tokensUsed,
    isRunning: phase === "running",
    runGeneration,
    cancelGeneration,
    retryFailedChapter,
    refreshJobState,
  };
}
