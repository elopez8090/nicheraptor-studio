"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { Loader2, NotebookPen, StickyNote } from "lucide-react";

import { ProjectNoteCard } from "@/components/notes/project-note-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { projectNoteToEditorHtml } from "@/lib/notes/note-editor-content";
import type { ProjectNote } from "@/lib/notes/types";

type ChapterOption = { id: string; number: number; title: string };

type EditorNotesPreviewProps = {
  projectId: string;
  selectedChapterId: string | null;
  chapters: ChapterOption[];
  editor: Editor | null;
};

export function EditorNotesPreview({
  projectId,
  selectedChapterId,
  chapters,
  editor,
}: EditorNotesPreviewProps) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const chapterById = useMemo(
    () => new Map(chapters.map((ch) => [ch.id, ch])),
    [chapters],
  );

  const loadNotes = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/ebooks/${projectId}/notes`);
      const data = (await response.json()) as {
        notes?: ProjectNote[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load notes.");
      }
      setNotes(data.notes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const recentNotes = useMemo(() => {
    const filtered = selectedChapterId
      ? notes.filter(
          (n) => !n.chapterId || n.chapterId === selectedChapterId,
        )
      : notes;
    return filtered.slice(0, 3);
  }, [notes, selectedChapterId]);

  const handleInsert = useCallback(
    (note: ProjectNote) => {
      if (!editor) {
        setStatus("Editor is still loading. Try again in a moment.");
        return;
      }
      editor
        .chain()
        .focus("end")
        .insertContent(projectNoteToEditorHtml(note))
        .run();
      setStatus("Inserted at end of chapter.");
    },
    [editor],
  );

  const handleTogglePin = useCallback(
    async (note: ProjectNote) => {
      setPinningId(note.id);
      setStatus(null);
      try {
        const response = await fetch(
          `/api/ebooks/${projectId}/notes/${note.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPinned: !note.isPinned }),
          },
        );
        const data = (await response.json()) as {
          note?: ProjectNote;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to update pin.");
        }
        if (data.note) {
          setNotes((prev) =>
            prev
              .map((n) => (n.id === data.note!.id ? data.note! : n))
              .sort((a, b) => {
                if (a.isPinned !== b.isPinned) {
                  return a.isPinned ? -1 : 1;
                }
                return (
                  new Date(b.updatedAt).getTime() -
                  new Date(a.updatedAt).getTime()
                );
              }),
          );
        }
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Failed to pin.");
      } finally {
        setPinningId(null);
      }
    },
    [projectId],
  );

  const handleDelete = useCallback(
    async (noteId: string) => {
      setDeletingId(noteId);
      setStatus(null);
      try {
        const response = await fetch(
          `/api/ebooks/${projectId}/notes/${noteId}`,
          { method: "DELETE" },
        );
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to delete.");
        }
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Failed to delete.");
      } finally {
        setDeletingId(null);
      }
    },
    [projectId],
  );

  return (
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <StickyNote className="size-4" aria-hidden />
          Recent notes
        </CardTitle>
        <CardDescription className="text-xs">
          Pin notes on the full notes page. Insert into the active chapter from
          here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="sm" className="h-8 w-full text-xs" asChild>
          <Link href={`/ebooks/${projectId}/notes`}>
            <NotebookPen className="size-3.5" aria-hidden />
            Open notes vault
          </Link>
        </Button>

        {status ? (
          <p className="text-xs text-muted-foreground" role="status">
            {status}
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : recentNotes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No notes yet. Capture ideas and sources on the notes page.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {recentNotes.map((note) => {
              const ch = note.chapterId
                ? chapterById.get(note.chapterId)
                : undefined;
              const chapterLabel = ch
                ? `Chapter ${ch.number}: ${ch.title}`
                : null;
              return (
                <ProjectNoteCard
                  key={note.id}
                  note={note}
                  chapters={chapters}
                  chapterLabel={chapterLabel}
                  compact
                  onEdit={() => {
                    window.location.href = `/ebooks/${projectId}/notes`;
                  }}
                  onDelete={handleDelete}
                  onTogglePin={handleTogglePin}
                  onInsert={handleInsert}
                  deleting={deletingId === note.id}
                  pinning={pinningId === note.id}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
