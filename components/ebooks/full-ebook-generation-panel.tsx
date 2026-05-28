"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Square } from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GenerationJobProgress } from "@/components/generation/generation-job-progress";
import { LibraryFrameworkSelect } from "@/components/content-library/library-framework-select";
import { RegenerateChapterDialog } from "@/components/ebooks/regenerate-chapter-dialog";
import { SaveToLibraryDialog } from "@/components/content-library/save-to-library-dialog";
import { cn } from "@/lib/utils";
import type { ChapterGenerationStatus } from "@/lib/ebooks/chapter-workflow-types";
import {
  type GenerationChapterSnapshot,
  useFullEbookGeneration,
} from "@/lib/ebooks/use-full-ebook-generation";
import type { AiQualityTier } from "@/lib/ebooks/ai-quality-settings";

type FullEbookGenerationPanelProps = {
  projectId: string;
  ebookTitle: string;
  audience: string;
  goal: string;
  chapters: GenerationChapterSnapshot[];
  className?: string;
  compact?: boolean;
  onChapterGenerated?: (chapterId: string, content: string) => void;
  onRunningChange?: (running: boolean) => void;
};

export function FullEbookGenerationPanel({
  projectId,
  ebookTitle: _ebookTitle,
  audience: _audience,
  goal: _goal,
  chapters,
  className,
  compact = false,
  onChapterGenerated,
  onRunningChange,
}: FullEbookGenerationPanelProps) {
  const toast = useToast();
  const [localChapters, setLocalChapters] = useState(chapters);
  const prevPhaseRef = useRef<string | null>(null);
  const [regenerateExisting, setRegenerateExisting] = useState(false);
  const [confirmChapterId, setConfirmChapterId] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [libraryFrameworkId, setLibraryFrameworkId] = useState<string | null>(
    null,
  );
  const [saveGeneratedOpen, setSaveGeneratedOpen] = useState(false);
  const [lastGeneratedContent, setLastGeneratedContent] = useState("");

  const handleChapterGenerated = useCallback(
    (chapterId: string, content: string) => {
      setLocalChapters((prev) =>
        prev.map((ch) =>
          ch.id === chapterId
            ? { ...ch, status: "generated" as ChapterGenerationStatus }
            : ch,
        ),
      );
      setLastGeneratedContent(content);
      onChapterGenerated?.(chapterId, content);
    },
    [onChapterGenerated],
  );

  const generation = useFullEbookGeneration({
    projectId,
    ebookTitle: _ebookTitle,
    audience: _audience,
    goal: _goal,
    chapters: localChapters,
    regenerateExistingChapters: regenerateExisting,
    libraryFrameworkId,
    onChapterGenerated: handleChapterGenerated,
  });

  useEffect(() => {
    onRunningChange?.(generation.isRunning);
  }, [generation.isRunning, onRunningChange]);

  useEffect(() => {
    const phase = generation.phase;
    if (prevPhaseRef.current !== "completed" && phase === "completed") {
      toast.success("Generation complete", "All scheduled chapters were generated.");
    }
    if (prevPhaseRef.current !== "failed" && phase === "failed") {
      toast.error(
        "Generation stopped",
        generation.job?.errorMessage ?? "A chapter failed during generation.",
      );
    }
    prevPhaseRef.current = phase;
  }, [generation.job?.errorMessage, generation.phase, toast]);

  const generatedCount = localChapters.filter(
    (c) => c.status === "generated",
  ).length;
  const progressPercent =
    localChapters.length > 0
      ? Math.round((generatedCount / localChapters.length) * 100)
      : 0;

  const runProgressPercent = generation.isRunning
    ? generation.progressPercent
    : progressPercent;

  const [singleGeneratingId, setSingleGeneratingId] = useState<string | null>(
    null,
  );

  const generateOneChapter = useCallback(
    async (chapterId: string, regenerate: boolean) => {
      const chapter = localChapters.find((c) => c.id === chapterId);
      if (!chapter || generation.isRunning) {
        return;
      }

      setSingleError(null);
      setSingleGeneratingId(chapterId);
      const prevChapter = localChapters
        .filter((c) => c.number < chapter.number)
        .sort((a, b) => b.number - a.number)[0];

      const action = regenerate ? "regenerate" : "generate";

      try {
        const res = await fetch(
          `/api/ebooks/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterId)}/${action}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quality: generation.quality,
              previousChapterId: prevChapter?.id,
              libraryFrameworkId: libraryFrameworkId ?? undefined,
            }),
          },
        );

        const data = (await res.json()) as { content?: string; error?: string };
        if (!res.ok || !data.content) {
          setSingleError(data.error ?? "Could not regenerate chapter.");
          return;
        }
        handleChapterGenerated(chapterId, data.content);
      } catch {
        setSingleError("Network error while generating the chapter.");
      } finally {
        setSingleGeneratingId(null);
      }
    },
    [
      generation.isRunning,
      generation.quality,
      handleChapterGenerated,
      libraryFrameworkId,
      localChapters,
      projectId,
    ],
  );

  const confirmChapter = localChapters.find((c) => c.id === confirmChapterId);

  return (
    <Card className={cn("shadow-premium", className)}>
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <CardTitle className={compact ? "text-base" : "text-lg"}>
          Generate full ebook
        </CardTitle>
        <CardDescription className="text-sm">
          AI writes every chapter in order, saves each draft as it finishes, and
          keeps the editor usable while generation runs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            Writing quality
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {generation.qualityOptions.map((option) => {
              const active = generation.quality === option.tier;
              return (
                <button
                  key={option.tier}
                  type="button"
                  disabled={generation.isRunning}
                  onClick={() =>
                    generation.setQuality(option.tier as AiQualityTier)
                  }
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/70 bg-muted/30 hover:bg-muted/50",
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Rough estimate: ~{generation.costEstimate.totalTokens.toLocaleString()}{" "}
            tokens · ~${generation.costEstimate.estimatedUsd.toFixed(2)} USD
            (illustrative, not a bill).
          </p>
        </fieldset>

        <LibraryFrameworkSelect
          value={libraryFrameworkId}
          onChange={setLibraryFrameworkId}
        />

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            disabled={generation.isRunning}
            checked={regenerateExisting}
            onChange={(e) => setRegenerateExisting(e.target.checked)}
          />
          <span>
            <span className="font-medium text-foreground">
              Regenerate existing chapters
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              When off, only empty or not-yet-generated chapters are written.
            </span>
          </span>
        </label>

        <GenerationJobProgress
          phase={generation.phase}
          job={generation.job}
          isRunning={generation.isRunning}
          currentChapterTitle={generation.currentChapterTitle}
          currentChapterNumber={generation.currentChapterNumber}
          completedInRun={generation.completedInRun}
          totalChapters={generation.totalChapters}
          progressPercent={runProgressPercent}
          tokensUsed={generation.tokensUsed}
          error={generation.error}
        />

        {!generation.isRunning && !generation.error ? (
          <p className="text-sm text-muted-foreground">
            {generatedCount} of {localChapters.length} chapters ready
          </p>
        ) : null}

        {singleError ? (
          <p className="text-sm text-destructive" role="alert">
            {singleError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size={compact ? "default" : "lg"}
            disabled={generation.isRunning || localChapters.length === 0}
            aria-busy={generation.isRunning}
            onClick={() => void generation.runGeneration()}
          >
            {generation.isRunning ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Generating…
              </>
            ) : (
              <>
                <Sparkles aria-hidden />
                Generate full ebook
              </>
            )}
          </Button>

          {generation.isRunning ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void generation.cancelGeneration()}
            >
              <Square className="size-4" aria-hidden />
              Cancel
            </Button>
          ) : null}

          {generation.phase === "failed" && generation.failedChapterId ? (
            <Button
              type="button"
              variant="outline"
              disabled={generation.isRunning}
              onClick={() => void generation.retryFailedChapter()}
            >
              Retry failed chapter
            </Button>
          ) : null}
        </div>

        {!compact && localChapters.length > 0 ? (
          <ul className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Per-chapter
            </p>
            {localChapters.map((chapter) => {
              const busy =
                singleGeneratingId === chapter.id ||
                (generation.isRunning &&
                  generation.currentChapterTitle === chapter.title);
              return (
                <li
                  key={chapter.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-background/80 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    Ch. {chapter.number}: {chapter.title}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    disabled={generation.isRunning || busy}
                    onClick={() => {
                      if (chapter.status === "generated") {
                        setConfirmChapterId(chapter.id);
                      } else {
                        void generateOneChapter(chapter.id, false);
                      }
                    }}
                  >
                    {busy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : chapter.status === "generated" ? (
                      "Regenerate chapter"
                    ) : (
                      "Generate chapter"
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {lastGeneratedContent ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSaveGeneratedOpen(true)}
          >
            Save last generated section to library
          </Button>
        ) : null}
      </CardContent>

      <SaveToLibraryDialog
        open={saveGeneratedOpen}
        onOpenChange={setSaveGeneratedOpen}
        defaultType="introduction"
        defaultTitle="Generated chapter section"
        defaultContent={lastGeneratedContent}
      />

      {confirmChapter ? (
        <RegenerateChapterDialog
          open={Boolean(confirmChapterId)}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmChapterId(null);
            }
          }}
          chapterTitle={confirmChapter.title}
          busy={singleGeneratingId === confirmChapter.id}
          onConfirm={() => {
            const id = confirmChapter.id;
            setConfirmChapterId(null);
            void generateOneChapter(id, true);
          }}
        />
      ) : null}
    </Card>
  );
}

/** Alias for docs / imports that use “generator” naming. */
export { FullEbookGenerationPanel as FullEbookGeneratorPanel };
