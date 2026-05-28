"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PublishingQueueItem } from "@/lib/publishing/types";
import { PUBLISHING_QUEUE_STATUSES } from "@/lib/publishing/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  items: PublishingQueueItem[];
  /** When true, only show non-published items */
  activeOnly?: boolean;
};

export function PublishingQueueBoard({ items, activeOnly = false }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = activeOnly
    ? items.filter(
        (i) => i.status !== "published" && i.status !== "failed",
      )
    : items;

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    try {
      await fetch(`/api/publishing/queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(id: string) {
    setBusyId(id);
    try {
      await fetch(`/api/publishing/queue/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        {activeOnly
          ? "Queue is empty. Repurpose content from the Publishing hub or add items via API."
          : "No publishing history yet."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border/60 bg-card">
      {filtered.map((item) => (
        <li
          key={item.id}
          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <p className="font-medium truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.contentType} · {item.targetPlatform} · priority {item.priority}
              {item.scheduledAt
                ? ` · scheduled ${new Date(item.scheduledAt).toLocaleString()}`
                : ""}
            </p>
            {item.errorMessage ? (
              <p className="text-xs text-destructive">{item.errorMessage}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant={item.status === "published" ? "default" : "secondary"}>
              {item.status.replace(/_/g, " ")}
            </Badge>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm sm:w-[160px]"
              value={item.status}
              disabled={busyId === item.id}
              onChange={(e) => updateStatus(item.id, e.target.value)}
              aria-label={`Status for ${item.title}`}
            >
              {PUBLISHING_QUEUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busyId === item.id}
              onClick={() => removeItem(item.id)}
            >
              Remove
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
