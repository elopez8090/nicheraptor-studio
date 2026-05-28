"use client";

import { Archive, Copy, Download, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type BulkActionId = "duplicate" | "archive" | "export" | "tag";

type BulkActionsBarProps = {
  selectedCount: number;
  className?: string;
  onClear: () => void;
  onAction: (action: BulkActionId) => void;
  busy?: boolean;
};

export function BulkActionsBar({
  selectedCount,
  className,
  onClear,
  onAction,
  busy = false,
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2",
        className,
      )}
      role="region"
      aria-label="Bulk actions"
    >
      <span className="text-sm font-medium">
        {selectedCount} selected
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onAction("duplicate")}
      >
        <Copy className="size-3.5" aria-hidden />
        Duplicate
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onAction("archive")}
      >
        <Archive className="size-3.5" aria-hidden />
        Archive
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onAction("export")}
      >
        <Download className="size-3.5" aria-hidden />
        Export
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => onAction("tag")}
      >
        <Tag className="size-3.5" aria-hidden />
        Tag
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
