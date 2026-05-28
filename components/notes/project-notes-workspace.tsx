"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Loader2,
  Plus,
  Search,
  StickyNote,
} from "lucide-react";

import { ProjectNoteCard } from "@/components/notes/project-note-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PROJECT_NOTE_TAGS,
  PROJECT_NOTE_TAG_LABELS,
  type ProjectNote,
  type ProjectNoteTag,
} from "@/lib/notes/types";
import { cn } from "@/lib/utils";

type ChapterOption = { id: string; number: number; title: string };

type ProjectNotesWorkspaceProps = {
  projectId: string;
  ebookTitle: string;
  chapters: ChapterOption[];
};

const EMPTY_NOTE_FORM = {
  tag: "idea" as ProjectNoteTag,
  title: "",
  body: "",
  chapterId: "",
  sourceUrl: "",
  sourceSummary: "",
};

export function ProjectNotesWorkspace({
  projectId,
  ebookTitle,
  chapters,
}: ProjectNotesWorkspaceProps) {
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<ProjectNoteTag | "all">("all");
  const [vaultOnly, setVaultOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [sourceForm, setSourceForm] = useState({
    title: "",
    sourceUrl: "",
    sourceSummary: "",
    chapterId: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectNote | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_NOTE_FORM);
  const [editSaving, setEditSaving] = useState(false);

  const chapterById = useMemo(
    () => new Map(chapters.map((ch) => [ch.id, ch])),
    [chapters],
  );

  const loadNotes = useCallback(async () => {
    setLoadError(null);
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
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load notes.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((note) => {
      if (vaultOnly && note.tag !== "source") {
        return false;
      }
      if (tagFilter !== "all" && note.tag !== tagFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      const haystack = [
        note.title,
        note.body,
        note.sourceSummary ?? "",
        note.sourceUrl ?? "",
        PROJECT_NOTE_TAG_LABELS[note.tag],
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [notes, search, tagFilter, vaultOnly]);

  const handleAddNote = useCallback(async () => {
    const body = noteForm.body.trim();
    if (!body) {
      setStatus("Write something in the note before saving.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/ebooks/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: noteForm.tag,
          title: noteForm.title.trim() || "Untitled note",
          body,
          chapterId: noteForm.chapterId || null,
        }),
      });
      const data = (await response.json()) as {
        note?: ProjectNote;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save note.");
      }
      if (data.note) {
        setNotes((prev) => [data.note!, ...prev]);
        setNoteForm(EMPTY_NOTE_FORM);
        setStatus("Note saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [noteForm, projectId]);

  const handleAddSource = useCallback(async () => {
    const sourceUrl = sourceForm.sourceUrl.trim();
    if (!sourceUrl) {
      setStatus("Source URL is required.");
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/ebooks/${projectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: "source",
          title: sourceForm.title.trim() || "Untitled source",
          body: "",
          sourceUrl,
          sourceSummary: sourceForm.sourceSummary.trim() || null,
          chapterId: sourceForm.chapterId || null,
        }),
      });
      const data = (await response.json()) as {
        note?: ProjectNote;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save source.");
      }
      if (data.note) {
        setNotes((prev) => [data.note!, ...prev]);
        setSourceForm({
          title: "",
          sourceUrl: "",
          sourceSummary: "",
          chapterId: "",
        });
        setStatus("Source saved to vault.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }, [projectId, sourceForm]);

  const openEdit = useCallback((note: ProjectNote) => {
    setEditing(note);
    setEditForm({
      tag: note.tag,
      title: note.title,
      body: note.body,
      chapterId: note.chapterId ?? "",
      sourceUrl: note.sourceUrl ?? "",
      sourceSummary: note.sourceSummary ?? "",
    });
    setEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editing) {
      return;
    }
    setEditSaving(true);
    setStatus(null);
    try {
      const response = await fetch(
        `/api/ebooks/${projectId}/notes/${editing.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tag: editForm.tag,
            title: editForm.title.trim() || editing.title,
            body: editForm.body.trim(),
            chapterId: editForm.chapterId || null,
            sourceUrl: editForm.sourceUrl.trim() || null,
            sourceSummary: editForm.sourceSummary.trim() || null,
          }),
        },
      );
      const data = (await response.json()) as {
        note?: ProjectNote;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update.");
      }
      if (data.note) {
        setNotes((prev) =>
          prev.map((n) => (n.id === data.note!.id ? data.note! : n)),
        );
        setEditOpen(false);
        setEditing(null);
        setStatus("Note updated.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update.");
    } finally {
      setEditSaving(false);
    }
  }, [editForm, editing, projectId]);

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
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to pin.");
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
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Failed to delete.");
      } finally {
        setDeletingId(null);
      }
    },
    [projectId],
  );

  const chapterSelect = (
    value: string,
    onChange: (value: string) => void,
    id: string,
  ) => (
    <select
      id={id}
      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Any chapter</option>
      {chapters.map((ch) => (
        <option key={ch.id} value={ch.id}>
          Chapter {ch.number}: {ch.title}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/50 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="pl-9"
            placeholder="Search notes, sources, and tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={tagFilter}
            onChange={(e) =>
              setTagFilter(e.target.value as ProjectNoteTag | "all")
            }
            aria-label="Filter by tag"
          >
            <option value="all">All tags</option>
            {PROJECT_NOTE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {PROJECT_NOTE_TAG_LABELS[tag]}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant={vaultOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setVaultOnly((v) => !v)}
          >
            <BookMarked className="size-3.5" aria-hidden />
            Sources only
          </Button>
        </div>
      </div>

      {status ? (
        <p className="text-sm text-muted-foreground" role="status">
          {status}
        </p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <Tabs defaultValue="capture" className="w-full">
        <TabsList>
          <TabsTrigger value="capture">Add</TabsTrigger>
          <TabsTrigger value="library">Library ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="capture" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <StickyNote className="size-4" aria-hidden />
                  New note
                </CardTitle>
                <CardDescription>
                  Tag ideas, quotes, reminders, and research for {ebookTitle}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium" htmlFor="note-tag">
                      Tag
                    </label>
                    <select
                      id="note-tag"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={noteForm.tag}
                      onChange={(e) =>
                        setNoteForm((f) => ({
                          ...f,
                          tag: e.target.value as ProjectNoteTag,
                        }))
                      }
                    >
                      {PROJECT_NOTE_TAGS.filter((t) => t !== "source").map(
                        (tag) => (
                          <option key={tag} value={tag}>
                            {PROJECT_NOTE_TAG_LABELS[tag]}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-medium"
                      htmlFor="note-chapter"
                    >
                      Chapter
                    </label>
                    {chapterSelect(
                      noteForm.chapterId,
                      (v) => setNoteForm((f) => ({ ...f, chapterId: v })),
                      "note-chapter",
                    )}
                  </div>
                </div>
                <Input
                  placeholder="Title"
                  value={noteForm.title}
                  onChange={(e) =>
                    setNoteForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Note content…"
                  className="min-h-[120px]"
                  value={noteForm.body}
                  onChange={(e) =>
                    setNoteForm((f) => ({ ...f, body: e.target.value }))
                  }
                />
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleAddNote()}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Plus className="size-4" aria-hidden />
                  )}
                  Add note
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookMarked className="size-4" aria-hidden />
                  Research vault
                </CardTitle>
                <CardDescription>
                  Save links and summaries tied to a chapter.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Source title"
                  value={sourceForm.title}
                  onChange={(e) =>
                    setSourceForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
                <Input
                  type="url"
                  placeholder="https://…"
                  value={sourceForm.sourceUrl}
                  onChange={(e) =>
                    setSourceForm((f) => ({ ...f, sourceUrl: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Short summary"
                  className="min-h-[80px]"
                  value={sourceForm.sourceSummary}
                  onChange={(e) =>
                    setSourceForm((f) => ({
                      ...f,
                      sourceSummary: e.target.value,
                    }))
                  }
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium" htmlFor="source-ch">
                    Related chapter
                  </label>
                  {chapterSelect(
                    sourceForm.chapterId,
                    (v) => setSourceForm((f) => ({ ...f, chapterId: v })),
                    "source-ch",
                  )}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => void handleAddSource()}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Plus className="size-4" aria-hidden />
                  )}
                  Save source
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading notes…
            </div>
          ) : filteredNotes.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-16 text-center",
              )}
            >
              <StickyNote
                className="size-10 text-muted-foreground/60"
                aria-hidden
              />
              <p className="mt-4 text-lg font-medium">No notes yet</p>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Capture ideas, quotes, and sources for this ebook. Pinned notes
                stay at the top of your library.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredNotes.map((note) => {
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
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onTogglePin={handleTogglePin}
                    deleting={deletingId === note.id}
                    pinning={pinningId === note.id}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
            <DialogDescription>
              Update content, tags, chapter link, or source fields.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={editForm.tag}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  tag: e.target.value as ProjectNoteTag,
                }))
              }
            >
              {PROJECT_NOTE_TAGS.map((tag) => (
                <option key={tag} value={tag}>
                  {PROJECT_NOTE_TAG_LABELS[tag]}
                </option>
              ))}
            </select>
            <Input
              placeholder="Title"
              value={editForm.title}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, title: e.target.value }))
              }
            />
            {editForm.tag === "source" ? (
              <>
                <Input
                  type="url"
                  placeholder="Source URL"
                  value={editForm.sourceUrl}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, sourceUrl: e.target.value }))
                  }
                />
                <Textarea
                  placeholder="Summary"
                  value={editForm.sourceSummary}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      sourceSummary: e.target.value,
                    }))
                  }
                />
              </>
            ) : (
              <Textarea
                placeholder="Note content"
                className="min-h-[100px]"
                value={editForm.body}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, body: e.target.value }))
                }
              />
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Chapter</label>
              {chapterSelect(
                editForm.chapterId,
                (v) => setEditForm((f) => ({ ...f, chapterId: v })),
                "edit-chapter",
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={editSaving}
              onClick={() => void handleSaveEdit()}
            >
              {editSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : null}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
