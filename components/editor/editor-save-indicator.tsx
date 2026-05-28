"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatLastSavedAgo } from "@/lib/workspace/format-last-saved";
import { cn } from "@/lib/utils";

export type EditorSavePhase = "idle" | "dirty" | "saving" | "saved" | "error";

type EditorSaveIndicatorProps = {
  phase: EditorSavePhase;
  errorMessage?: string | null;
  lastSavedAt: number | null;
  onSave: () => void;
  className?: string;
  compact?: boolean;
};

export function EditorSaveIndicator({
  phase,
  errorMessage,
  lastSavedAt,
  onSave,
  className,
  compact = false,
}: EditorSaveIndicatorProps) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (lastSavedAt === null) {
      return;
    }
    const id = window.setInterval(() => tick((n) => n + 1), 15_000);
    return () => window.clearInterval(id);
  }, [lastSavedAt]);

  const ago = formatLastSavedAgo(lastSavedAt);
  const statusTone =
    phase === "error"
      ? "text-destructive"
      : phase === "dirty"
        ? "text-amber-600 dark:text-amber-400"
        : phase === "saving"
          ? "text-muted-foreground"
          : "text-emerald-600 dark:text-emerald-400";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className={cn("text-xs font-semibold uppercase tracking-wide", statusTone)}>
        {phase === "dirty"
          ? "Unsaved"
          : phase === "saving"
            ? "Saving"
            : phase === "saved"
              ? "Saved"
              : phase === "error"
                ? "Save failed"
                : "Idle"}
      </span>
      {phase === "dirty" ? (
        <span className="text-sm text-amber-600 dark:text-amber-400">Unsaved changes</span>
      ) : null}
      {phase === "saving" ? (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
          Saving…
        </span>
      ) : null}
      {phase === "saved" ? (
        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Saved{ago ? ` · ${ago}` : ""}
        </span>
      ) : null}
      {(phase === "idle" || phase === "dirty") && ago ? (
        <span className="text-sm text-muted-foreground">Last saved {ago}</span>
      ) : null}
      {phase === "error" && errorMessage ? (
        <span className="max-w-[220px] text-sm text-destructive" role="alert">
          {errorMessage}
        </span>
      ) : null}
      {!compact ? (
        <Button
          type="button"
          size="sm"
          variant={phase === "dirty" ? "default" : "secondary"}
          onClick={onSave}
          disabled={phase === "saving"}
        >
          {phase === "saving" ? (
            <>
              <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      ) : null}
    </div>
  );
}
