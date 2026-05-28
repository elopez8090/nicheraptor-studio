"use client";

import { useState } from "react";
import {
  Copy,
  Heart,
  Loader2,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SaveToLibraryDialog } from "@/components/content-library/save-to-library-dialog";
import {
  CONTENT_LIBRARY_TYPE_LABELS,
  type ContentLibraryItem,
} from "@/lib/content-library/types";
import { cn } from "@/lib/utils";

type ContentLibraryCardProps = {
  item: ContentLibraryItem;
  onChanged: () => void;
  compact?: boolean;
};

export function ContentLibraryCard({
  item,
  onChanged,
  compact = false,
}: ContentLibraryCardProps) {
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview =
    item.content.length > 220
      ? `${item.content.slice(0, 220).replace(/\s+/g, " ")}…`
      : item.content.replace(/\s+/g, " ");

  async function toggleFavorite() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/content-library/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !item.favorite }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Update failed.");
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete “${item.title}”?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/content-library/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Delete failed.");
        return;
      }
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(item.content);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  return (
    <>
      <Card
        className={cn(
          "flex h-full flex-col border-border/80 transition-shadow hover:shadow-md",
          item.favorite && "ring-1 ring-amber-500/30",
        )}
      >
        <CardHeader className="gap-2 pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="shrink-0 font-normal">
              {CONTENT_LIBRARY_TYPE_LABELS[item.type]}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              disabled={busy}
              onClick={() => void toggleFavorite()}
              aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "size-4",
                  item.favorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground",
                )}
                aria-hidden
              />
            </Button>
          </div>
          <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
          {!compact ? (
            <CardDescription className="line-clamp-3 text-xs leading-relaxed">
              {preview || "No content yet."}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="flex-1 pt-0">
          {item.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <li key={tag}>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {tag}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No tags</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4">
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5" aria-hidden />
            Used {item.usageCount}×
          </p>
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void copyContent()}
            >
              <Copy className="size-3.5" aria-hidden />
              Copy
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void handleDelete()}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Trash2 className="size-3.5" aria-hidden />
              )}
              Delete
            </Button>
          </div>
          {error ? (
            <p className="w-full text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardFooter>
      </Card>

      <SaveToLibraryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialItem={item}
        onSaved={onChanged}
      />
    </>
  );
}
