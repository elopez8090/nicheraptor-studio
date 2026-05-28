"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import {
  CONTENT_LIBRARY_TYPE_LABELS,
  CONTENT_LIBRARY_TYPES,
  type ContentLibraryItem,
  type ContentLibraryType,
} from "@/lib/content-library/types";

type SaveToLibraryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "create" | "edit";
  initialItem?: ContentLibraryItem | null;
  defaultType?: ContentLibraryType;
  defaultTitle?: string;
  defaultContent?: string;
  onSaved?: () => void;
};

export function SaveToLibraryDialog({
  open,
  onOpenChange,
  mode = "create",
  initialItem = null,
  defaultType = "snippet",
  defaultTitle = "",
  defaultContent = "",
  onSaved,
}: SaveToLibraryDialogProps) {
  const [type, setType] = useState<ContentLibraryType>(defaultType);
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);
  const [tagsText, setTagsText] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    if (mode === "edit" && initialItem) {
      setType(initialItem.type);
      setTitle(initialItem.title);
      setContent(initialItem.content);
      setTagsText(initialItem.tags.join(", "));
      setFavorite(initialItem.favorite);
    } else {
      setType(defaultType);
      setTitle(defaultTitle);
      setContent(defaultContent);
      setTagsText("");
      setFavorite(false);
    }
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      resetForm();
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (mode === "edit" && initialItem) {
        const res = await fetch(`/api/content-library/${initialItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            title,
            content,
            tags,
            favorite,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === "string" ? data.error : "Save failed.");
          return;
        }
      } else {
        const res = await fetch("/api/content-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            title,
            content,
            tags,
            favorite,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(typeof data.error === "string" ? data.error : "Save failed.");
          return;
        }
      }

      onOpenChange(false);
      onSaved?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit library item" : "Save to content library"}
          </DialogTitle>
          <DialogDescription>
            Reuse snippets, prompts, frameworks, and sections across ebooks and articles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="lib-type" className="text-sm font-medium">
              Type
            </label>
            <select
              id="lib-type"
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as ContentLibraryType)}
            >
              {CONTENT_LIBRARY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CONTENT_LIBRARY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="lib-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="lib-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lib-content" className="text-sm font-medium">
              Content
            </label>
            <Textarea
              id="lib-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lib-tags" className="text-sm font-medium">
              Tags (comma-separated)
            </label>
            <Input
              id="lib-tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="marketing, nonfiction, lead magnet"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="size-4 rounded border-input"
            />
            Mark as favorite
          </label>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {mode === "edit" ? "Save changes" : "Save to library"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
