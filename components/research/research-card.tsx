"use client";

import { useCallback } from "react";
import {
  BookMarked,
  ClipboardCopy,
  FilePlus2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ResearchEntry } from "@/lib/research/types";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<ResearchEntry["researchType"], string> = {
  topic: "Topic",
  chapter: "Chapter",
  statistics: "Statistics",
  trends: "Trends",
  faqs: "FAQs",
  examples: "Examples",
  manual_note: "Note",
};

type ResearchCardProps = {
  entry: ResearchEntry;
  className?: string;
  onCopy: (entry: ResearchEntry) => void;
  onAddToChapter: (entry: ResearchEntry) => void;
  onDelete: (entryId: string) => void;
  deleting?: boolean;
};

export function ResearchCard({
  entry,
  className,
  onCopy,
  onAddToChapter,
  onDelete,
  deleting = false,
}: ResearchCardProps) {
  const handleCopy = useCallback(() => {
    onCopy(entry);
  }, [entry, onCopy]);

  return (
    <article
      className={cn(
        "rounded-xl border border-border/80 bg-card/90 p-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] uppercase">
              {TYPE_LABELS[entry.researchType]}
            </Badge>
            {entry.chapterId ? (
              <span className="text-[10px] text-muted-foreground">Chapter</span>
            ) : null}
          </div>
          <h4 className="text-sm font-semibold leading-snug">{entry.title}</h4>
          {entry.summary ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {entry.summary}
            </p>
          ) : null}
        </div>
        <BookMarked className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </div>

      <div className="mt-2 max-h-32 overflow-y-auto rounded-lg bg-muted/40 p-2 text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">
        {entry.content}
      </div>

      {entry.sources.length > 0 ? (
        <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
          {entry.sources.slice(0, 4).map((source) => (
            <li key={source.url} className="truncate">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={handleCopy}
        >
          <ClipboardCopy className="size-3.5" aria-hidden />
          Copy
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => onAddToChapter(entry)}
        >
          <FilePlus2 className="size-3.5" aria-hidden />
          Add to chapter
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-destructive hover:text-destructive"
          disabled={deleting}
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
