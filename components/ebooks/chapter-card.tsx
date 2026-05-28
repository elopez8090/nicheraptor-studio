"use client";

import { GeneratedChapterContent } from "@/components/ebooks/generated-chapter-content";
import { ChapterStatusBadge } from "@/components/ebooks/chapter-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EbookChapter } from "@/lib/ebooks/chapter-workflow-types";
import { Loader2, Sparkles } from "lucide-react";

type ChapterCardProps = {
  chapter: EbookChapter;
  isGenerating: boolean;
  onGenerate: (chapterId: string) => void;
  fullBookJobRunning?: boolean;
};

export function ChapterCard({
  chapter,
  isGenerating,
  onGenerate,
  fullBookJobRunning = false,
}: ChapterCardProps) {
  const isGenerated = chapter.status === "generated";
  const hasContent = Boolean(chapter.content?.trim());

  return (
    <Card className="shadow-premium transition-shadow hover:shadow-premium-lg">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chapter {chapter.number}
            </p>
            <CardTitle className="text-xl font-semibold">{chapter.title}</CardTitle>
          </div>
          <ChapterStatusBadge status={chapter.status} />
        </div>
        <CardDescription className="text-base leading-relaxed">
          {chapter.summary}
        </CardDescription>
      </CardHeader>

      {isGenerated && hasContent ? (
        <CardContent className="pt-0">
          <GeneratedChapterContent
            chapterTitle={chapter.title}
            content={chapter.content ?? ""}
          />
        </CardContent>
      ) : null}

      <CardFooter className="justify-end gap-2 border-t bg-muted/20">
        <Button
          type="button"
          size="default"
          variant={isGenerated && hasContent ? "outline" : "default"}
          disabled={isGenerating || fullBookJobRunning}
          onClick={() => onGenerate(chapter.id)}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Generating…
            </>
          ) : (
            <>
              <Sparkles aria-hidden />
              {isGenerated && hasContent ? "Regenerate chapter" : "Generate chapter"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
