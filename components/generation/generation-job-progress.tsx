"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { GenerationJobPublicView } from "@/lib/generation/types";
import type { FullEbookGenerationPhase } from "@/lib/ebooks/use-full-ebook-generation";

type GenerationJobProgressProps = {
  phase: FullEbookGenerationPhase;
  job: GenerationJobPublicView | null;
  isRunning: boolean;
  currentChapterTitle: string | null;
  currentChapterNumber: number;
  completedInRun: number;
  totalChapters: number;
  progressPercent: number;
  tokensUsed: number;
  error: string | null;
  className?: string;
};

export function GenerationJobProgress({
  phase,
  job,
  isRunning,
  currentChapterTitle,
  currentChapterNumber,
  completedInRun,
  totalChapters,
  progressPercent,
  tokensUsed,
  error,
  className,
}: GenerationJobProgressProps) {
  const statusLine = (() => {
    if (isRunning) {
      return `Generating chapter ${currentChapterNumber} of ${totalChapters}`;
    }
    if (phase === "completed") {
      return "Full ebook generation completed.";
    }
    if (phase === "failed") {
      return job?.errorMessage ?? "Generation stopped on a failed chapter.";
    }
    if (phase === "cancelled") {
      return "Generation cancelled.";
    }
    if (job?.status === "failed") {
      return job.errorMessage ?? "Last generation run failed.";
    }
    return "Ready to generate chapters";
  })();

  const completedChapters =
    job?.chapterPlan.slice(0, job.currentStep) ?? [];

  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-muted/25 px-4 py-3",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-foreground">{statusLine}</p>
      {isRunning && currentChapterTitle ? (
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {currentChapterTitle}
        </p>
      ) : null}
      {isRunning ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Completed this run: {completedInRun} / {totalChapters}
        </p>
      ) : null}

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted transition-all duration-300"
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {completedChapters.length > 0 && isRunning ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {completedChapters.map((ch) => (
            <li key={ch.id} className="flex items-center gap-1.5">
              <CheckCircle2
                className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <span className="truncate">
                Ch. {ch.number}: {ch.title}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {tokensUsed > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Tokens this run: {tokensUsed.toLocaleString()}
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {phase === "completed" ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" aria-hidden />
          All targeted chapters were saved to your project.
        </p>
      ) : null}

      {isRunning ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Syncing progress…
        </p>
      ) : null}
    </div>
  );
}
