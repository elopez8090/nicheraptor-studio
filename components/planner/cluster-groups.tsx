"use client";

import { useMemo, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PLANNER_IDEA_TYPE_LABELS } from "@/lib/planner/constants";
import type {
  ContentClusterRecord,
  ContentTopicRecord,
} from "@/lib/planner/types";

type ClusterGroupsProps = {
  initialClusters: ContentClusterRecord[];
  initialTopics: ContentTopicRecord[];
};

const CLUSTER_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6",
];

export function ClusterGroups({
  initialClusters,
  initialTopics,
}: ClusterGroupsProps) {
  const [clusters, setClusters] = useState(initialClusters);
  const [topics, setTopics] = useState(initialTopics);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const topicsByCluster = useMemo(() => {
    const map = new Map<string, ContentTopicRecord[]>();
    for (const cluster of clusters) {
      map.set(cluster.id, []);
    }
    for (const topic of topics) {
      if (topic.clusterId && map.has(topic.clusterId)) {
        map.get(topic.clusterId)!.push(topic);
      }
    }
    return map;
  }, [clusters, topics]);

  const unclustered = useMemo(
    () => topics.filter((t) => !t.clusterId),
    [topics],
  );

  async function createCluster() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const res = await fetch("/api/planner/clusters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmed,
        description: description.trim(),
        color: CLUSTER_COLORS[clusters.length % CLUSTER_COLORS.length],
      }),
    });
    const data = (await res.json()) as {
      cluster?: ContentClusterRecord;
      error?: string;
    };
    if (data.cluster) {
      setClusters((prev) => [data.cluster!, ...prev]);
      setName("");
      setDescription("");
    }
  }

  async function deleteCluster(id: string) {
    await fetch(`/api/planner/clusters/${id}`, { method: "DELETE" });
    setClusters((prev) => prev.filter((c) => c.id !== id));
    setTopics((prev) =>
      prev.map((t) => (t.clusterId === id ? { ...t, clusterId: null } : t)),
    );
  }

  async function assignTopic(topicId: string, clusterId: string | null) {
    const res = await fetch(`/api/planner/topics/${topicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clusterId }),
    });
    const data = (await res.json()) as { topic?: ContentTopicRecord };
    if (data.topic) {
      setTopics((prev) =>
        prev.map((t) => (t.id === topicId ? data.topic! : t)),
      );
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border/80 bg-card p-6">
        <h2 className="text-lg font-semibold">New cluster</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cluster name (pillar theme)"
          />
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={2}
            className="sm:col-span-2"
          />
        </div>
        <Button type="button" className="mt-3" onClick={() => void createCluster()}>
          <Plus className="size-4" aria-hidden />
          Create cluster
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {clusters.map((cluster) => (
          <section
            key={cluster.id}
            className="rounded-2xl border border-border/80 bg-card shadow-sm"
            style={{
              borderTopWidth: 4,
              borderTopColor: cluster.color ?? CLUSTER_COLORS[0],
            }}
          >
            <div className="flex items-start justify-between gap-2 p-5">
              <div className="flex items-start gap-3">
                <Layers className="size-5 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{cluster.name}</h3>
                  {cluster.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cluster.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void deleteCluster(cluster.id)}
                aria-label={`Delete cluster ${cluster.name}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <ul className="space-y-2 border-t border-border/60 px-5 py-4">
              {(topicsByCluster.get(cluster.id) ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  No topics in this cluster yet.
                </li>
              ) : (
                (topicsByCluster.get(cluster.id) ?? []).map((topic) => (
                  <li
                    key={topic.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{topic.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {PLANNER_IDEA_TYPE_LABELS[topic.ideaType]}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        ))}
      </div>

      <section className="rounded-2xl border border-dashed border-border p-5">
        <h3 className="font-semibold">Unclustered topics</h3>
        <p className="text-sm text-muted-foreground">
          Assign topics to a cluster to build pillar ↔ supporting maps.
        </p>
        <ul className="mt-4 space-y-2">
          {unclustered.length === 0 ? (
            <li className="text-sm text-muted-foreground">All topics are clustered.</li>
          ) : (
            unclustered.map((topic) => (
              <li
                key={topic.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 px-3 py-2"
              >
                <span className="flex-1 text-sm font-medium">{topic.title}</span>
                <select
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) void assignTopic(topic.id, v);
                  }}
                >
                  <option value="">Add to cluster…</option>
                  {clusters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
