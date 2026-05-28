import type {
  PlannerEntityKind,
  PlannerIdeaType,
  PlannerRelationshipType,
  PlannerWorkflowStatus,
  RoadmapStatus,
} from "@/lib/planner/constants";

// re-export for convenience in UI layers
export type { PlannerEntityKind };

export type ContentTopicRecord = {
  id: string;
  title: string;
  description: string;
  ideaType: PlannerIdeaType;
  workflowStatus: PlannerWorkflowStatus;
  niche: string;
  targetKeyword: string;
  priority: number;
  clusterId: string | null;
  linkedEbookProjectId: string | null;
  linkedArticleId: string | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ContentClusterRecord = {
  id: string;
  name: string;
  description: string;
  pillarTopicId: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContentRelationshipRecord = {
  id: string;
  fromKind: PlannerEntityKind;
  fromId: string;
  toKind: PlannerEntityKind;
  toId: string;
  relationshipType: PlannerRelationshipType;
  notes: string;
  createdAt: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  topicId?: string | null;
  workflowStatus?: PlannerWorkflowStatus;
  sortOrder?: number;
  notes?: string;
};

export type PublishingRoadmapRecord = {
  id: string;
  title: string;
  description: string;
  goal: string;
  targetDate: string | null;
  status: RoadmapStatus;
  items: RoadmapItem[];
  createdAt: string;
  updatedAt: string;
};

export type PlannerSnapshot = {
  topics: ContentTopicRecord[];
  clusters: ContentClusterRecord[];
  relationships: ContentRelationshipRecord[];
  roadmaps: PublishingRoadmapRecord[];
};

export type ContentInventoryItem = {
  kind: "ebook" | "article" | "topic";
  id: string;
  title: string;
  topicOrNiche: string;
  keyword: string;
  status: string;
};

export type PlannerLinkableEntity = {
  kind: PlannerEntityKind;
  id: string;
  label: string;
};
