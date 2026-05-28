"use client";

import { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLANNER_WORKFLOW_STATUS_LABELS } from "@/lib/planner/constants";
import type { PublishingRoadmapRecord, RoadmapItem } from "@/lib/planner/types";

type RoadmapCardsProps = {
  initialRoadmaps: PublishingRoadmapRecord[];
};

export function RoadmapCards({ initialRoadmaps }: RoadmapCardsProps) {
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");

  async function createRoadmap() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const res = await fetch("/api/planner/roadmaps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: trimmed,
        goal: goal.trim(),
        status: "active",
        items: [],
      }),
    });
    const data = (await res.json()) as {
      roadmap?: PublishingRoadmapRecord;
    };
    if (data.roadmap) {
      setRoadmaps((prev) => [data.roadmap!, ...prev]);
      setTitle("");
      setGoal("");
    }
  }

  async function updateRoadmap(
    id: string,
    patch: Partial<PublishingRoadmapRecord>,
  ) {
    const res = await fetch(`/api/planner/roadmaps/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await res.json()) as { roadmap?: PublishingRoadmapRecord };
    if (data.roadmap) {
      setRoadmaps((prev) =>
        prev.map((r) => (r.id === id ? data.roadmap! : r)),
      );
    }
  }

  async function deleteRoadmap(id: string) {
    await fetch(`/api/planner/roadmaps/${id}`, { method: "DELETE" });
    setRoadmaps((prev) => prev.filter((r) => r.id !== id));
  }

  function addItem(roadmapId: string, itemTitle: string) {
    const roadmap = roadmaps.find((r) => r.id === roadmapId);
    if (!roadmap || !itemTitle.trim()) return;
    const items: RoadmapItem[] = [
      ...roadmap.items,
      {
        id: crypto.randomUUID(),
        title: itemTitle.trim(),
        sortOrder: roadmap.items.length,
        workflowStatus: "idea",
      },
    ];
    void updateRoadmap(roadmapId, { items });
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/80 bg-card p-6">
        <h2 className="text-lg font-semibold">New publishing roadmap</h2>
        <p className="text-sm text-muted-foreground">
          Sequence launches — calendar & scheduler hooks can attach to these
          items later.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Roadmap title"
          />
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Publishing goal"
            rows={2}
            className="sm:col-span-2"
          />
        </div>
        <Button type="button" className="mt-3" onClick={() => void createRoadmap()}>
          <Plus className="size-4" aria-hidden />
          Create roadmap
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {roadmaps.map((roadmap) => (
          <RoadmapCard
            key={roadmap.id}
            roadmap={roadmap}
            onUpdate={(patch) => void updateRoadmap(roadmap.id, patch)}
            onDelete={() => void deleteRoadmap(roadmap.id)}
            onAddItem={(t) => addItem(roadmap.id, t)}
          />
        ))}
      </div>
    </div>
  );
}

function RoadmapCard({
  roadmap,
  onUpdate,
  onDelete,
  onAddItem,
}: {
  roadmap: PublishingRoadmapRecord;
  onUpdate: (patch: Partial<PublishingRoadmapRecord>) => void;
  onDelete: () => void;
  onAddItem: (title: string) => void;
}) {
  const [itemTitle, setItemTitle] = useState("");

  return (
    <article className="flex flex-col rounded-2xl border border-border/80 bg-card shadow-sm">
      <div className="flex items-start justify-between gap-2 border-b border-border/60 p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{roadmap.title}</h3>
            <Badge variant="outline">{roadmap.status}</Badge>
          </div>
          {roadmap.goal ? (
            <p className="mt-1 text-sm text-muted-foreground">{roadmap.goal}</p>
          ) : null}
          {roadmap.targetDate ? (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5" aria-hidden />
              Target: {roadmap.targetDate}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:text-destructive"
          onClick={onDelete}
          aria-label="Delete roadmap"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <ol className="flex-1 space-y-2 p-5">
        {roadmap.items.length === 0 ? (
          <li className="text-sm text-muted-foreground">No milestones yet.</li>
        ) : (
          roadmap.items
            .slice()
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
              >
                <p className="font-medium">{item.title}</p>
                {item.workflowStatus ? (
                  <p className="text-xs text-muted-foreground">
                    {PLANNER_WORKFLOW_STATUS_LABELS[item.workflowStatus]}
                  </p>
                ) : null}
              </li>
            ))
        )}
      </ol>

      <div className="flex gap-2 border-t border-border/60 p-4">
        <Input
          value={itemTitle}
          onChange={(e) => setItemTitle(e.target.value)}
          placeholder="Add milestone…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAddItem(itemTitle);
              setItemTitle("");
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onAddItem(itemTitle);
            setItemTitle("");
          }}
        >
          Add
        </Button>
      </div>

      <div className="border-t border-border/60 px-4 py-3">
        <select
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs"
          value={roadmap.status}
          onChange={(e) =>
            onUpdate({
              status: e.target.value as PublishingRoadmapRecord["status"],
            })
          }
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </article>
  );
}
