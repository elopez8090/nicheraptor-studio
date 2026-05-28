"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";

import { ChapterCard } from "@/components/ebooks/chapter-card";
import { FullEbookGenerationPanel } from "@/components/ebooks/full-ebook-generation-panel";
import { RegenerateChapterDialog } from "@/components/ebooks/regenerate-chapter-dialog";
import { EbookMetaPanel } from "@/components/ebooks/ebook-meta-panel";
import { Button } from "@/components/ui/button";
import type {
  EbookChapter,
  EbookWithChapters,
} from "@/lib/ebooks/chapter-workflow-types";

type EbookChaptersWorkspaceProps = {
  initialEbook: EbookWithChapters;
};

export function EbookChaptersWorkspace({
  initialEbook,
}: EbookChaptersWorkspaceProps) {
  const [chapters, setChapters] = useState<EbookChapter[]>(
    initialEbook.chapters,
  );
  const [generatingChapterId, setGeneratingChapterId] = useState<string | null>(
    null,
  );
  const [fullBookJobRunning, setFullBookJobRunning] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [pendingRegenerateId, setPendingRegenerateId] = useState<string | null>(
    null,
  );

  const runChapterGenerate = useCallback(
    async (chapterId: string, regenerate: boolean) => {
      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter) {
        return;
      }

      setGenerateError(null);
      setGeneratingChapterId(chapterId);

      const action = regenerate ? "regenerate" : "generate";
      const prevChapter = chapters
        .filter((c) => c.number < chapter.number)
        .sort((a, b) => b.number - a.number)[0];

      try {
        const res = await fetch(
          `/api/ebooks/${encodeURIComponent(initialEbook.id)}/chapters/${encodeURIComponent(chapterId)}/${action}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quality: "balanced",
              previousChapterId: prevChapter?.id,
            }),
          },
        );

        const data = (await res.json()) as { content?: string; error?: string };

        if (!res.ok) {
          setGenerateError(
            data.error ?? "Failed to generate chapter. Please try again.",
          );
          return;
        }

        if (!data.content) {
          setGenerateError("The server did not return chapter content.");
          return;
        }

        setChapters((prev) =>
          prev.map((ch) =>
            ch.id === chapterId
              ? {
                  ...ch,
                  status: "generated",
                  content: data.content ?? null,
                }
              : ch,
          ),
        );
      } catch {
        setGenerateError(
          "Network error while generating the chapter. Please try again.",
        );
      } finally {
        setGeneratingChapterId(null);
      }
    },
    [chapters, initialEbook.id],
  );

  const handleGenerate = useCallback(
    (chapterId: string) => {
      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter) {
        return;
      }
      const hasContent =
        chapter.status === "generated" && Boolean(chapter.content?.trim());
      if (hasContent) {
        setPendingRegenerateId(chapterId);
        return;
      }
      void runChapterGenerate(chapterId, false);
    },
    [chapters, runChapterGenerate],
  );

  const generatedCount = chapters.filter((c) => c.status === "generated").length;
  const progressPercent =
    chapters.length > 0
      ? Math.round((generatedCount / chapters.length) * 100)
      : 0;

  const pendingChapter = chapters.find((c) => c.id === pendingRegenerateId);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-premium">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Writing progress
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {generatedCount}{" "}
              <span className="text-lg font-normal text-muted-foreground">
                / {chapters.length} chapters
              </span>
            </p>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-primary">
            {progressPercent}%
          </p>
        </div>
        <div
          className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Chapter generation progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <FullEbookGenerationPanel
        projectId={initialEbook.id}
        ebookTitle={initialEbook.title}
        audience={initialEbook.audience}
        goal={initialEbook.goal}
        chapters={chapters.map((ch) => ({
          id: ch.id,
          number: ch.number,
          title: ch.title,
          summary: ch.summary,
          status: ch.status,
        }))}
        onChapterGenerated={(chapterId, content) => {
          setChapters((prev) =>
            prev.map((ch) =>
              ch.id === chapterId
                ? { ...ch, status: "generated", content }
                : ch,
            ),
          );
        }}
        onRunningChange={setFullBookJobRunning}
      />

      <EbookMetaPanel
        ebook={{
          title: initialEbook.title,
          audience: initialEbook.audience,
          goal: initialEbook.goal,
        }}
      />

      <section aria-labelledby="chapters-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="chapters-heading"
              className="text-xl font-semibold tracking-tight text-foreground"
            >
              Chapters
            </h2>
            <p className="mt-1.5 text-base text-muted-foreground">
              {generatedCount} of {chapters.length} chapters generated
            </p>
            {generateError ? (
              <p className="mt-2 text-sm text-destructive" role="alert">
                {generateError}
              </p>
            ) : null}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/ebooks/${initialEbook.id}/editor`}>
              <FileText aria-hidden />
              Open manuscript editor
            </Link>
          </Button>
        </div>

        <ul className="flex flex-col gap-4">
          {chapters.map((chapter) => (
            <li key={chapter.id}>
              <ChapterCard
                chapter={chapter}
                isGenerating={generatingChapterId === chapter.id}
                fullBookJobRunning={fullBookJobRunning}
                onGenerate={handleGenerate}
              />
            </li>
          ))}
        </ul>
      </section>

      {pendingChapter ? (
        <RegenerateChapterDialog
          open={Boolean(pendingRegenerateId)}
          onOpenChange={(open) => {
            if (!open) {
              setPendingRegenerateId(null);
            }
          }}
          chapterTitle={pendingChapter.title}
          busy={generatingChapterId === pendingChapter.id}
          onConfirm={() => {
            const id = pendingChapter.id;
            setPendingRegenerateId(null);
            void runChapterGenerate(id, true);
          }}
        />
      ) : null}
    </div>
  );
}
