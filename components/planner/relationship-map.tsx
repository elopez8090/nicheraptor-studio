"use client";

import { useMemo, useState } from "react";
import { Link2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  PLANNER_ENTITY_KINDS,
  PLANNER_RELATIONSHIP_TYPE_LABELS,
  PLANNER_RELATIONSHIP_TYPES,
  type PlannerEntityKind,
  type PlannerRelationshipType,
} from "@/lib/planner/constants";
import type {
  ContentRelationshipRecord,
  PlannerLinkableEntity,
} from "@/lib/planner/types";

export type { PlannerLinkableEntity };

type RelationshipMapProps = {
  initialRelationships: ContentRelationshipRecord[];
  entities: PlannerLinkableEntity[];
};

export function RelationshipMap({
  initialRelationships,
  entities,
}: RelationshipMapProps) {
  const [relationships, setRelationships] = useState(initialRelationships);
  const [fromKind, setFromKind] = useState<PlannerEntityKind>("topic");
  const [fromId, setFromId] = useState("");
  const [toKind, setToKind] = useState<PlannerEntityKind>("ebook");
  const [toId, setToId] = useState("");
  const [relationshipType, setRelationshipType] =
    useState<PlannerRelationshipType>("supports_pillar");

  const entityLabel = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of entities) {
      map.set(`${e.kind}:${e.id}`, e.label);
    }
    return (kind: PlannerEntityKind, id: string) =>
      map.get(`${kind}:${id}`) ?? `${kind} ${id.slice(0, 8)}…`;
  }, [entities]);

  const filteredFrom = entities.filter((e) => e.kind === fromKind);
  const filteredTo = entities.filter((e) => e.kind === toKind);

  async function addRelationship() {
    if (!fromId || !toId) return;
    const res = await fetch("/api/planner/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromKind,
        fromId,
        toKind,
        toId,
        relationshipType,
      }),
    });
    const data = (await res.json()) as {
      relationship?: ContentRelationshipRecord;
      error?: string;
    };
    if (data.relationship) {
      setRelationships((prev) => [data.relationship!, ...prev]);
      setFromId("");
      setToId("");
    }
  }

  async function removeRelationship(id: string) {
    await fetch(`/api/planner/relationships?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setRelationships((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-6 rounded-2xl border border-border/80 bg-card p-6">
      <div className="flex items-center gap-2">
        <Link2 className="size-5 text-primary" aria-hidden />
        <h2 className="text-lg font-semibold">Content relationships</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Link articles ↔ ebooks, lead magnets, pillar content, and series.
        Ready for calendar, WordPress, and repurposing workflows later.
      </p>

      <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
        <select
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          value={fromKind}
          onChange={(e) => {
            setFromKind(e.target.value as PlannerEntityKind);
            setFromId("");
          }}
        >
          {PLANNER_ENTITY_KINDS.map((k) => (
            <option key={k} value={k}>
              From: {k}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
        >
          <option value="">Select source…</option>
          {filteredFrom.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          value={relationshipType}
          onChange={(e) =>
            setRelationshipType(e.target.value as PlannerRelationshipType)
          }
        >
          {PLANNER_RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {PLANNER_RELATIONSHIP_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          value={toKind}
          onChange={(e) => {
            setToKind(e.target.value as PlannerEntityKind);
            setToId("");
          }}
        >
          {PLANNER_ENTITY_KINDS.map((k) => (
            <option key={k} value={k}>
              To: {k}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-input bg-background px-2 py-2 text-sm"
          value={toId}
          onChange={(e) => setToId(e.target.value)}
        >
          <option value="">Select target…</option>
          {filteredTo.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="button" onClick={() => void addRelationship()}>
        Add link
      </Button>

      <ul className="divide-y divide-border/60">
        {relationships.length === 0 ? (
          <li className="py-6 text-sm text-muted-foreground">
            No relationships yet. Connect a supporting article to a pillar ebook,
            or a lead magnet to an ebook.
          </li>
        ) : (
          relationships.map((rel) => (
            <li
              key={rel.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <span>
                <span className="font-medium">
                  {entityLabel(rel.fromKind, rel.fromId)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  → {PLANNER_RELATIONSHIP_TYPE_LABELS[rel.relationshipType]} →{" "}
                </span>
                <span className="font-medium">
                  {entityLabel(rel.toKind, rel.toId)}
                </span>
              </span>
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:text-destructive"
                onClick={() => void removeRelationship(rel.id)}
                aria-label="Remove relationship"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
