"use client";

import {
  ExternalLink,
  Loader2,
  Pin,
  PinOff,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProjectNote } from "@/lib/notes/types";
import { PROJECT_NOTE_TAG_LABELS } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

type ChapterOption = { id: string; number: number; title: string };

type ProjectNoteCardProps = {
  note: ProjectNote;
  chapters: ChapterOption[];
  chapterLabel: string | null;
  onEdit: (note: ProjectNote) => void;
  onDelete: (noteId: string) => void;
  onTogglePin: (note: ProjectNote) => void;
  onInsert?: (note: ProjectNote) => void;
  deleting?: boolean;
  pinning?: boolean;
  compact?: boolean;
};

export function ProjectNoteCard({
  note,
  chapterLabel,
  onEdit,
  onDelete,
  onTogglePin,
  onInsert,
  deleting,
  pinning,
  compact,
}: ProjectNoteCardProps) {
  const preview =
    note.tag === "source"
      ? note.sourceSummary?.trim() || note.body.trim()
      : note.body.trim();

  return (
    <Card
      className={cn(
        "border-border/70 shadow-sm transition-colors",
        note.isPinned && "border-primary/40 bg-primary/5",
      )}
    >
      <CardHeader className={cn("pb-2", compact && "p-3 pb-1")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px] uppercase">
                {PROJECT_NOTE_TAG_LABELS[note.tag]}
              </Badge>
              {note.isPinned ? (
                <Badge variant="outline" className="text-[10px]">
                  Pinned
                </Badge>
              ) : null}
            </div>
            <CardTitle className={cn("text-sm leading-snug", compact && "text-xs")}>
              {note.title}
            </CardTitle>
            {chapterLabel ? (
              <CardDescription className="mt-1 text-[11px]">
                {chapterLabel}
              </CardDescription>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            disabled={pinning}
            onClick={() => onTogglePin(note)}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
          >
            {pinning ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : note.isPinned ? (
              <PinOff className="size-3.5" aria-hidden />
            ) : (
              <Pin className="size-3.5" aria-hidden />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-3 pt-0", compact && "p-3 pt-0")}>
        {preview ? (
          <p className="line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">
            {preview}
          </p>
        ) : null}
        {note.sourceUrl ? (
          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" aria-hidden />
            Open source
          </a>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {onInsert ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onInsert(note)}
            >
              Insert into chapter
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onEdit(note)}
          >
            <Pencil className="size-3" aria-hidden />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => onDelete(note.id)}
          >
            {deleting ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : (
              <Trash2 className="size-3" aria-hidden />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
