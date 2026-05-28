import type {
  PlannerEntityKind,
  PlannerIdeaType,
  PlannerRelationshipType,
  PlannerWorkflowStatus,
  RoadmapStatus,
} from "@/lib/planner/constants";
import {
  isPlannerEntityKind,
  isPlannerIdeaType,
  isPlannerRelationshipType,
  isPlannerWorkflowStatus,
} from "@/lib/planner/constants";
import type {
  ContentClusterRecord,
  ContentRelationshipRecord,
  ContentTopicRecord,
  PublishingRoadmapRecord,
  RoadmapItem,
} from "@/lib/planner/types";

type TopicRow = {
  id: string;
  title: string;
  description: string | null;
  idea_type: string;
  workflow_status: string;
  niche: string | null;
  target_keyword: string | null;
  priority: number | null;
  cluster_id: string | null;
  linked_ebook_project_id: string | null;
  linked_article_id: string | null;
  metadata: Record<string, unknown> | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
};

type ClusterRow = {
  id: string;
  name: string;
  description: string | null;
  pillar_topic_id: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

type RelationshipRow = {
  id: string;
  from_kind: string;
  from_id: string;
  to_kind: string;
  to_id: string;
  relationship_type: string;
  notes: string | null;
  created_at: string;
};

type RoadmapRow = {
  id: string;
  title: string;
  description: string | null;
  goal: string | null;
  target_date: string | null;
  status: string;
  items: unknown;
  created_at: string;
  updated_at: string;
};

function safeIdeaType(value: string): PlannerIdeaType {
  return isPlannerIdeaType(value) ? value : "article_idea";
}

function safeWorkflowStatus(value: string): PlannerWorkflowStatus {
  return isPlannerWorkflowStatus(value) ? value : "idea";
}

function safeEntityKind(value: string): PlannerEntityKind {
  return isPlannerEntityKind(value) ? value : "topic";
}

function safeRelationshipType(value: string): PlannerRelationshipType {
  return isPlannerRelationshipType(value) ? value : "related";
}

function safeRoadmapStatus(value: string): RoadmapStatus {
  if (value === "active" || value === "completed") return value;
  return "draft";
}

function parseRoadmapItems(raw: unknown): RoadmapItem[] {
  if (!Array.isArray(raw)) return [];
  const items: RoadmapItem[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const o = entry as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!title) return;
    const id =
      typeof o.id === "string" && o.id.trim() ? o.id.trim() : `item-${index}`;
    const topicIdRaw =
      typeof o.topicId === "string"
        ? o.topicId
        : typeof o.topic_id === "string"
          ? o.topic_id
          : undefined;
    const workflowStatus =
      typeof o.workflowStatus === "string"
        ? o.workflowStatus
        : typeof o.workflow_status === "string"
          ? o.workflow_status
          : undefined;
    const item: RoadmapItem = {
      id,
      title,
      sortOrder:
        typeof o.sortOrder === "number"
          ? o.sortOrder
          : typeof o.sort_order === "number"
            ? o.sort_order
            : index,
    };
    if (topicIdRaw) item.topicId = topicIdRaw;
    if (workflowStatus && isPlannerWorkflowStatus(workflowStatus)) {
      item.workflowStatus = workflowStatus;
    }
    if (typeof o.notes === "string") item.notes = o.notes;
    items.push(item);
  });
  return items;
}

export function mapTopicRow(row: TopicRow): ContentTopicRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    ideaType: safeIdeaType(row.idea_type),
    workflowStatus: safeWorkflowStatus(row.workflow_status),
    niche: row.niche ?? "",
    targetKeyword: row.target_keyword ?? "",
    priority: row.priority ?? 0,
    clusterId: row.cluster_id,
    linkedEbookProjectId: row.linked_ebook_project_id,
    linkedArticleId: row.linked_article_id,
    metadata: row.metadata ?? {},
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapClusterRow(row: ClusterRow): ContentClusterRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    pillarTopicId: row.pillar_topic_id,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRelationshipRow(
  row: RelationshipRow,
): ContentRelationshipRecord {
  return {
    id: row.id,
    fromKind: safeEntityKind(row.from_kind),
    fromId: row.from_id,
    toKind: safeEntityKind(row.to_kind),
    toId: row.to_id,
    relationshipType: safeRelationshipType(row.relationship_type),
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

export function mapRoadmapRow(row: RoadmapRow): PublishingRoadmapRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    goal: row.goal ?? "",
    targetDate: row.target_date,
    status: safeRoadmapStatus(row.status),
    items: parseRoadmapItems(row.items),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
