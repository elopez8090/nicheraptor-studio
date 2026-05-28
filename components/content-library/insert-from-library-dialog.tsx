"use client";

import { useCallback, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { insertLibraryContentIntoEditor } from "@/lib/content-library/insert-editor-content";
import {
  CONTENT_LIBRARY_TYPE_LABELS,
  type ContentLibraryItem,
  type ContentLibraryType,
} from "@/lib/content-library/types";
import { cn } from "@/lib/utils";

type InsertFromLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editor: Editor | null;
  /** Limit picker to HTML-friendly section types */
  allowedTypes?: ContentLibraryType[];
};

export function InsertFromLibraryDialog({
  open,
  onOpenChange,
  editor,
  allowedTypes,
}: InsertFromLibraryDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ContentLibraryItem[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentLibraryType | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content-library");
      const data = (await res.json()) as { items?: ContentLibraryItem[] };
      if (!res.ok || !Array.isArray(data.items)) {
        setError("Could not load library.");
        return;
      }
      setItems(data.items);
    } catch {
      setError("Network error loading library.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
      if (nextOpen) {
        void loadItems();
      }
    },
    [loadItems, onOpenChange],
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const tag of item.tags) {
        set.add(tag);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (allowedTypes?.length) {
      list = list.filter((item) => allowedTypes.includes(item.type));
    }
    if (typeFilter !== "all") {
      list = list.filter((item) => item.type === typeFilter);
    }
    if (tagFilter) {
      list = list.filter((item) => item.tags.includes(tagFilter));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q),
      );
    }
    return list.slice(0, 40);
  }, [items, allowedTypes, typeFilter, tagFilter, search]);

  async function handleInsert(item: ContentLibraryItem) {
    if (!editor) {
      setError("Editor is not ready.");
      return;
    }
    insertLibraryContentIntoEditor(editor, item.content, "cursor");
    void fetch(`/api/content-library/${item.id}/use`, { method: "POST" });
    onOpenChange(false);
  }

  const typeOptions = allowedTypes?.length
    ? allowedTypes
    : (Object.keys(CONTENT_LIBRARY_TYPE_LABELS) as ContentLibraryType[]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Insert from library</DialogTitle>
          <DialogDescription>
            Search reusable blocks and insert at the cursor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 border-b border-border px-6 py-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-9"
              aria-label="Search library items"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as ContentLibraryType | "all")
              }
              aria-label="Filter by type"
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_LIBRARY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setTagFilter((current) => (current === tag ? null : tag))
                }
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs",
                  tagFilter === tag
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading…
            </p>
          ) : error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matching items.</p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-border/80 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
                    onClick={() => void handleInsert(item)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {CONTENT_LIBRARY_TYPE_LABELS[item.type]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.content.replace(/\s+/g, " ").slice(0, 160)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border px-6 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
