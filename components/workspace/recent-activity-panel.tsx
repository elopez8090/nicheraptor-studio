"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Download,
  FileText,
  Sparkles,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getWorkspaceActivity,
  type WorkspaceActivityEntry,
  type WorkspaceActivityKind,
} from "@/lib/workspace/workspace-activity";
import { cn } from "@/lib/utils";

const kindMeta: Record<
  WorkspaceActivityKind,
  { icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  edit_project: { icon: BookOpen, label: "Edited" },
  edit_article: { icon: FileText, label: "Edited" },
  open_page: { icon: FileText, label: "Opened" },
  export: { icon: Download, label: "Export" },
  ai_generation: { icon: Sparkles, label: "AI" },
  note: { icon: StickyNote, label: "Note" },
  open_article: { icon: FileText, label: "Opened" },
  library_item: { icon: BookOpen, label: "Library" },
};

function formatRelative(at: number) {
  const diff = Date.now() - at;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "short" }).format(
    new Date(at),
  );
}

type RecentActivityPanelProps = {
  className?: string;
  limit?: number;
  compact?: boolean;
};

export function RecentActivityPanel({
  className,
  limit = 12,
  compact = false,
}: RecentActivityPanelProps) {
  const [entries, setEntries] = useState<WorkspaceActivityEntry[]>(() =>
    getWorkspaceActivity(limit),
  );

  useEffect(() => {
    const onStorage = () => setEntries(getWorkspaceActivity(limit));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [limit]);

  if (entries.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Activity from edits, exports, and AI runs will show up here.
      </p>
    );
  }

  return (
    <ul className={cn("flex flex-col gap-1", className)}>
      {entries.map((entry) => {
        const meta = kindMeta[entry.kind];
        const Icon = meta.icon;
        const inner = (
          <>
            <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium text-foreground">
                {entry.title}
              </span>
              {!compact ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {entry.meta ?? meta.label} · {formatRelative(entry.at)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {formatRelative(entry.at)}
                </span>
              )}
            </span>
          </>
        );
        return (
          <li key={`${entry.kind}-${entry.id}-${entry.at}`}>
            {entry.href ? (
              <Link
                href={entry.href}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-muted"
              >
                {inner}
              </Link>
            ) : (
              <div className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm">
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function RecentActivityPanelHeader({
  onRefresh,
}: {
  onRefresh?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium">Recent activity</p>
      {onRefresh ? (
        <Button type="button" variant="ghost" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      ) : null}
    </div>
  );
}
