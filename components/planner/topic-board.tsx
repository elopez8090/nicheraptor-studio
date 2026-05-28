"use client";

import { useCallback, useMemo, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PLANNER_IDEA_TYPE_LABELS,
  PLANNER_IDEA_TYPES,
  PLANNER_WORKFLOW_STATUSES,
  PLANNER_WORKFLOW_STATUS_LABELS,
  type PlannerIdeaType,
  type PlannerWorkflowStatus,
} from "@/lib/planner/constants";
import type { ContentTopicRecord } from "@/lib/planner/types";

type TopicBoardProps = {
  topics: ContentTopicRecord[];
  onTopicsChange: (topics: ContentTopicRecord[]) => void;
};

export function TopicBoard({ topics, onTopicsChange }: TopicBoardProps) {
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(
      PLANNER_WORKFLOW_STATUSES.map((s) => [s, [] as ContentTopicRecord[]]),
    ) as Record<PlannerWorkflowStatus, ContentTopicRecord[]>;
    for (const topic of topics) {
      map[topic.workflowStatus]?.push(topic);
    }
    for (const status of PLANNER_WORKFLOW_STATUSES) {
      map[status].sort(
        (a, b) => b.priority - a.priority || a.title.localeCompare(b.title),
      );
    }
    return map;
  }, [topics]);

  const updateTopic = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const res = await fetch(`/api/planner/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = (await res.json()) as {
        topic?: ContentTopicRecord;
        error?: string;
      };
      if (!res.ok || !data.topic) {
        throw new Error(data.error ?? "Update failed");
      }
      onTopicsChange(topics.map((t) => (t.id === id ? data.topic! : t)));
    },
    [onTopicsChange, topics],
  );

  async function addTopic() {
    const title = newTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/planner/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, ideaType: "article_idea" }),
      });
      const data = (await res.json()) as {
        topic?: ContentTopicRecord;
        error?: string;
      };
      if (!res.ok || !data.topic) {
        throw new Error(data.error ?? "Create failed");
      }
      onTopicsChange([data.topic!, ...topics]);
      setNewTitle("");
    } finally {
      setSaving(false);
    }
  }

  async function removeTopic(id: string) {
    await fetch(`/api/planner/topics/${id}`, { method: "DELETE" });
    onTopicsChange(topics.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Quick-add topic idea…"
          onKeyDown={(e) => {
            if (e.key === "Enter") void addTopic();
          }}
        />
        <Button type="button" disabled={saving} onClick={() => void addTopic()}>
          <Plus className="size-4" aria-hidden />
          Add idea
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
        {PLANNER_WORKFLOW_STATUSES.map((status) => (
          <div
            key={status}
            className="flex min-h-[280px] flex-col rounded-2xl border border-border/70 bg-muted/20"
          >
            <div className="border-b border-border/60 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {PLANNER_WORKFLOW_STATUS_LABELS[status]}
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {byStatus[status].length}
              </p>
            </div>
            <ul className="flex flex-1 flex-col gap-2 p-2">
              {byStatus[status].map((topic) => (
                <li
                  key={topic.id}
                  className="group rounded-xl border border-border/60 bg-card p-3 shadow-sm"
                >
                  <div className="flex items-start gap-1">
                    <GripVertical
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground/40"
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{topic.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {topic.description || "No description"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <select
                          className="max-w-full rounded-md border border-input bg-background px-1.5 py-0.5 text-[11px]"
                          value={topic.ideaType}
                          onChange={(e) =>
                            void updateTopic(topic.id, {
                              ideaType: e.target.value as PlannerIdeaType,
                            })
                          }
                        >
                          {PLANNER_IDEA_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {PLANNER_IDEA_TYPE_LABELS[t]}
                            </option>
                          ))}
                        </select>
                        <select
                          className="max-w-full rounded-md border border-input bg-background px-1.5 py-0.5 text-[11px]"
                          value={topic.workflowStatus}
                          onChange={(e) =>
                            void updateTopic(topic.id, {
                              workflowStatus: e.target
                                .value as PlannerWorkflowStatus,
                            })
                          }
                        >
                          {PLANNER_WORKFLOW_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {PLANNER_WORKFLOW_STATUS_LABELS[s]}
                            </option>
                          ))}
                        </select>
                      </div>
                      {topic.targetKeyword ? (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {topic.targetKeyword}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      onClick={() => void removeTopic(topic.id)}
                      aria-label={`Delete ${topic.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
