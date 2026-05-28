"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  BarChart3,
  BookOpenCheck,
  HelpCircle,
  Lightbulb,
  Loader2,
  Microscope,
  Save,
  TrendingUp,
} from "lucide-react";

import { ResearchCard } from "@/components/research/research-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ResearchAction, ResearchEntry } from "@/lib/research/types";
import { cn } from "@/lib/utils";

const RESEARCH_BUTTONS: {
  action: ResearchAction;
  label: string;
  icon: typeof Microscope;
  needsChapter?: boolean;
}[] = [
  { action: "topic", label: "Research Topic", icon: Microscope },
  {
    action: "chapter",
    label: "Research Chapter",
    icon: BookOpenCheck,
    needsChapter: true,
  },
  { action: "statistics", label: "Find Statistics", icon: BarChart3 },
  { action: "trends", label: "Find Trends", icon: TrendingUp },
  { action: "faqs", label: "Find FAQs", icon: HelpCircle },
  { action: "examples", label: "Find Examples", icon: Lightbulb },
];

type ResearchPanelProps = {
  projectId: string;
  selectedChapterId: string | null;
  editor: Editor | null;
  className?: string;
};

function entryToPlainText(entry: ResearchEntry): string {
  const sourceBlock =
    entry.sources.length > 0
      ? `\n\nSources:\n${entry.sources.map((s) => `- ${s.title}: ${s.url}`).join("\n")}`
      : "";
  return `${entry.title}\n\n${entry.summary ? `${entry.summary}\n\n` : ""}${entry.content}${sourceBlock}`;
}

function entryToEditorHtml(entry: ResearchEntry): string {
  const paragraphs = entry.content
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  const sourceItems =
    entry.sources.length > 0
      ? `<h3>Research sources</h3><ul>${entry.sources
          .map(
            (s) =>
              `<li><a href="${escapeAttr(s.url)}">${escapeHtml(s.title)}</a></li>`,
          )
          .join("")}</ul>`
      : "";

  return `<h2>${escapeHtml(entry.title)}</h2>${paragraphs}${sourceItems}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export function ResearchPanel({
  projectId,
  selectedChapterId,
  editor,
  className,
}: ResearchPanelProps) {
  const [entries, setEntries] = useState<ResearchEntry[]>([]);
  const [includeSourceReferences, setIncludeSourceReferences] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ResearchAction | null>(null);
  const [panelMessage, setPanelMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const loadResearch = useCallback(async () => {
    setListError(null);
    setLoadingList(true);
    try {
      const response = await fetch(`/api/research/${projectId}`);
      const data = (await response.json()) as {
        entries?: ResearchEntry[];
        settings?: { includeSourceReferences?: boolean };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load research.");
      }
      setEntries(data.entries ?? []);
      setIncludeSourceReferences(Boolean(data.settings?.includeSourceReferences));
    } catch (error) {
      setListError(
        error instanceof Error ? error.message : "Failed to load research.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadResearch();
  }, [loadResearch]);

  const runResearchAction = useCallback(
    async (action: ResearchAction) => {
      setPanelMessage(null);
      setActiveAction(action);
      try {
        const response = await fetch(`/api/research/${projectId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            chapterId: selectedChapterId,
          }),
        });
        const data = (await response.json()) as {
          entry?: ResearchEntry;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Research failed.");
        }
        if (data.entry) {
          setEntries((prev) => [data.entry!, ...prev]);
          setPanelMessage("Research saved to this project.");
        }
      } catch (error) {
        setPanelMessage(
          error instanceof Error ? error.message : "Research failed.",
        );
      } finally {
        setActiveAction(null);
      }
    },
    [projectId, selectedChapterId],
  );

  const handleToggleCitations = useCallback(
    async (checked: boolean) => {
      setIncludeSourceReferences(checked);
      setPanelMessage(null);
      try {
        const response = await fetch(`/api/research/${projectId}/settings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ includeSourceReferences: checked }),
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to update setting.");
        }
        setPanelMessage(
          checked
            ? "Chapters will include a Sources section when generated."
            : "Source references disabled for generation.",
        );
      } catch (error) {
        setIncludeSourceReferences(!checked);
        setPanelMessage(
          error instanceof Error ? error.message : "Failed to update setting.",
        );
      }
    },
    [projectId],
  );

  const handleSaveNote = useCallback(async () => {
    const content = noteBody.trim();
    if (!content) {
      setPanelMessage("Write a note before saving.");
      return;
    }
    setSavingNote(true);
    setPanelMessage(null);
    try {
      const response = await fetch(`/api/research/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: noteTitle.trim() || "Saved note",
          content,
          chapterId: selectedChapterId,
        }),
      });
      const data = (await response.json()) as {
        entry?: ResearchEntry;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save note.");
      }
      if (data.entry) {
        setEntries((prev) => [data.entry!, ...prev]);
        setNoteBody("");
        setNoteTitle("");
        setPanelMessage("Note saved.");
      }
    } catch (error) {
      setPanelMessage(
        error instanceof Error ? error.message : "Failed to save note.",
      );
    } finally {
      setSavingNote(false);
    }
  }, [noteBody, noteTitle, projectId, selectedChapterId]);

  const handleDelete = useCallback(
    async (entryId: string) => {
      setDeletingId(entryId);
      setPanelMessage(null);
      try {
        const response = await fetch(
          `/api/research/${projectId}/entries/${entryId}`,
          { method: "DELETE" },
        );
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to delete.");
        }
        setEntries((prev) => prev.filter((e) => e.id !== entryId));
      } catch (error) {
        setPanelMessage(
          error instanceof Error ? error.message : "Failed to delete.",
        );
      } finally {
        setDeletingId(null);
      }
    },
    [projectId],
  );

  const handleCopy = useCallback(async (entry: ResearchEntry) => {
    try {
      await navigator.clipboard.writeText(entryToPlainText(entry));
      setPanelMessage("Copied to clipboard.");
    } catch {
      setPanelMessage("Could not copy to clipboard.");
    }
  }, []);

  const handleAddToChapter = useCallback(
    (entry: ResearchEntry) => {
      if (!editor) {
        setPanelMessage("Editor is still loading. Try again in a moment.");
        return;
      }
      editor
        .chain()
        .focus("end")
        .insertContent(entryToEditorHtml(entry))
        .run();
      setPanelMessage("Inserted at end of chapter.");
    },
    [editor],
  );

  const sortedEntries = useMemo(() => entries, [entries]);

  return (
    <Card className={cn("border-border/80 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Research</CardTitle>
        <CardDescription className="text-xs">
          Gather context before generating chapters. Notes are used automatically
          during AI chapter generation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {RESEARCH_BUTTONS.map(({ action, label, icon: Icon, needsChapter }) => {
            const disabled =
              Boolean(activeAction) ||
              (needsChapter && !selectedChapterId);
            return (
              <Button
                key={action}
                type="button"
                variant="outline"
                size="sm"
                className="h-9 justify-start text-xs"
                disabled={disabled}
                onClick={() => void runResearchAction(action)}
              >
                {activeAction === action ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                ) : (
                  <Icon className="size-3.5" aria-hidden />
                )}
                {label}
              </Button>
            );
          })}
        </div>

        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={includeSourceReferences}
            onChange={(e) => void handleToggleCitations(e.target.checked)}
          />
          <span>
            <span className="font-medium text-foreground">
              Include source references
            </span>
            <span className="mt-0.5 block text-muted-foreground">
              When generating chapters, append a Sources list from saved research
              URLs.
            </span>
          </span>
        </label>

        <div className="space-y-2 rounded-lg border border-dashed border-border/70 p-3">
          <p className="text-xs font-medium text-foreground">Save a note</p>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs shadow-sm"
            placeholder="Note title (optional)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          <Textarea
            placeholder="Your research note…"
            className="min-h-[72px] text-xs"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
          />
          <Button
            type="button"
            size="sm"
            className="h-8 w-full text-xs"
            disabled={savingNote}
            onClick={() => void handleSaveNote()}
          >
            {savingNote ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Save className="size-3.5" aria-hidden />
            )}
            Save note
          </Button>
        </div>

        {panelMessage ? (
          <p className="text-xs text-muted-foreground" role="status">
            {panelMessage}
          </p>
        ) : null}
        {listError ? (
          <p className="text-xs text-destructive" role="alert">
            {listError}
          </p>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved research
          </p>
          {loadingList ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </div>
          ) : sortedEntries.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No research yet. Run an action above or save a note.
            </p>
          ) : (
            <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
              {sortedEntries.map((entry) => (
                <ResearchCard
                  key={entry.id}
                  entry={entry}
                  onCopy={handleCopy}
                  onAddToChapter={handleAddToChapter}
                  onDelete={handleDelete}
                  deleting={deletingId === entry.id}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
