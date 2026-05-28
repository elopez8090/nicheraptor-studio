"use client";

import { useCallback, useMemo, useState } from "react";
import { LibraryBig, Plus, Search } from "lucide-react";

import { ContentLibraryCard } from "@/components/content-library/content-library-card";
import {
  BulkActionsBar,
  type BulkActionId,
} from "@/components/workspace/bulk-actions-bar";
import { SaveToLibraryDialog } from "@/components/content-library/save-to-library-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CONTENT_LIBRARY_TYPE_LABELS,
  CONTENT_LIBRARY_TYPES,
  type ContentLibraryItem,
  type ContentLibraryTag,
  type ContentLibraryType,
} from "@/lib/content-library/types";
import { cn } from "@/lib/utils";

type ContentLibraryWorkspaceProps = {
  initialItems: ContentLibraryItem[];
  initialTags: ContentLibraryTag[];
  /** When set, only show these types (route-specific pages). */
  typeFilter?: ContentLibraryType[];
  showRecent?: boolean;
  showFavorites?: boolean;
};

export function ContentLibraryWorkspace({
  initialItems,
  initialTags,
  typeFilter,
  showRecent = true,
  showFavorites = true,
}: ContentLibraryWorkspaceProps) {
  const [items, setItems] = useState(initialItems);
  const [tags] = useState(initialTags);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<ContentLibraryType | "all">("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const refresh = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter?.length) {
      params.set("type", typeFilter.join(","));
    }
    const res = await fetch(`/api/content-library?${params.toString()}`);
    const data = (await res.json()) as { items?: ContentLibraryItem[] };
    if (Array.isArray(data.items)) {
      setItems(data.items);
    }
  }, [typeFilter]);

  const scopedItems = useMemo(() => {
    let list = items;
    if (typeFilter?.length) {
      list = list.filter((item) => typeFilter.includes(item.type));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (activeTag) {
      list = list.filter((item) => item.tags.includes(activeTag));
    }
    if (activeType !== "all") {
      list = list.filter((item) => item.type === activeType);
    }
    if (favoritesOnly) {
      list = list.filter((item) => item.favorite);
    }
    return list;
  }, [items, typeFilter, search, activeTag, activeType, favoritesOnly]);

  const favorites = useMemo(
    () => scopedItems.filter((item) => item.favorite).slice(0, 6),
    [scopedItems],
  );

  const recent = useMemo(() => [...scopedItems].slice(0, 8), [scopedItems]);

  const typeOptions = typeFilter?.length
    ? typeFilter
    : (CONTENT_LIBRARY_TYPES as readonly ContentLibraryType[]);

  const defaultCreateType =
    typeFilter?.length === 1 ? typeFilter[0]! : ("snippet" as ContentLibraryType);

  async function handleBulkAction(action: BulkActionId) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      for (const id of ids) {
        if (action === "archive") {
          await fetch(`/api/content-library/${id}`, { method: "DELETE" });
        } else if (action === "tag") {
          await fetch(`/api/content-library/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tags: ["bulk-tagged"] }),
          });
        } else if (action === "export") {
          window.open(`/api/content-library/${id}`, "_blank");
        } else if (action === "duplicate") {
          const item = items.find((i) => i.id === id);
          if (!item) continue;
          await fetch("/api/content-library", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: item.type,
              title: `${item.title} (copy)`,
              content: item.content,
              tags: item.tags,
            }),
          });
        }
      }
      setSelectedIds(new Set());
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, content, or tags…"
            className="pl-9"
            aria-label="Search library"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden />
          New item
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFavoritesOnly((v) => !v)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            favoritesOnly
              ? "bg-amber-500/15 text-amber-800 dark:text-amber-200"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          Favorites only
        </button>
        {!typeFilter?.length ? (
          <select
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs"
            value={activeType}
            onChange={(e) =>
              setActiveType(e.target.value as ContentLibraryType | "all")
            }
            aria-label="Filter by type"
          >
            <option value="all">All types</option>
            {CONTENT_LIBRARY_TYPES.map((t) => (
              <option key={t} value={t}>
                {CONTENT_LIBRARY_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        ) : null}
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() =>
              setActiveTag((current) => (current === tag.name ? null : tag.name))
            }
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeTag === tag.name
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            #{tag.name}
          </button>
        ))}
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onClear={() => setSelectedIds(new Set())}
        onAction={(action) => void handleBulkAction(action)}
      />

      {showFavorites && favorites.length > 0 && !favoritesOnly ? (
        <PageSection title="Favorites" description="Pinned blocks you reach for often.">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((item) => (
              <li key={item.id}>
                <ContentLibraryCard item={item} onChanged={() => void refresh()} compact />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      {showRecent && recent.length > 0 ? (
        <PageSection title="Recent" description="Latest updates in your library.">
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((item) => (
              <li key={`recent-${item.id}`}>
                <ContentLibraryCard item={item} onChanged={() => void refresh()} />
              </li>
            ))}
          </ul>
        </PageSection>
      ) : null}

      <PageSection
        title="All items"
        description={`${scopedItems.length} item${scopedItems.length === 1 ? "" : "s"} matching filters.`}
      >
        {scopedItems.length === 0 ? (
          <EmptyState
            icon={LibraryBig}
            title="No library items yet"
            description="Save snippets, prompts, frameworks, and reusable sections from the editor, or use New item above."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {scopedItems.map((item) => (
              <li key={item.id} className="relative">
                <label className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/90 px-1.5 py-1 text-xs shadow-sm">
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-input"
                    checked={selectedIds.has(item.id)}
                    onChange={() => {
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id);
                        else next.add(item.id);
                        return next;
                      });
                    }}
                    aria-label={`Select ${item.title}`}
                  />
                  Select
                </label>
                <ContentLibraryCard item={item} onChanged={() => void refresh()} />
              </li>
            ))}
          </ul>
        )}
      </PageSection>

      <SaveToLibraryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultType={defaultCreateType}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
