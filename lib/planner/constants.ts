export const PLANNER_IDEA_TYPES = [
  "ebook_idea",
  "article_idea",
  "content_cluster",
  "lead_magnet",
  "seo_topic_map",
  "niche_subtopic",
  "faq_opportunity",
] as const;

export type PlannerIdeaType = (typeof PLANNER_IDEA_TYPES)[number];

export const PLANNER_IDEA_TYPE_LABELS: Record<PlannerIdeaType, string> = {
  ebook_idea: "Ebook idea",
  article_idea: "Article idea",
  content_cluster: "Content cluster",
  lead_magnet: "Lead magnet",
  seo_topic_map: "SEO topic map",
  niche_subtopic: "Niche subtopic",
  faq_opportunity: "FAQ opportunity",
};

export const PLANNER_WORKFLOW_STATUSES = [
  "idea",
  "researching",
  "outlining",
  "drafting",
  "editing",
  "published",
] as const;

export type PlannerWorkflowStatus = (typeof PLANNER_WORKFLOW_STATUSES)[number];

export const PLANNER_WORKFLOW_STATUS_LABELS: Record<
  PlannerWorkflowStatus,
  string
> = {
  idea: "Idea",
  researching: "Researching",
  outlining: "Outlining",
  drafting: "Drafting",
  editing: "Editing",
  published: "Published",
};

export const PLANNER_ENTITY_KINDS = ["topic", "ebook", "article"] as const;
export type PlannerEntityKind = (typeof PLANNER_ENTITY_KINDS)[number];

export const PLANNER_RELATIONSHIP_TYPES = [
  "related",
  "supports_pillar",
  "lead_magnet_for",
  "article_series",
  "newsletter_expansion",
  "seo_cluster",
  "repurposes",
] as const;

export type PlannerRelationshipType =
  (typeof PLANNER_RELATIONSHIP_TYPES)[number];

export const PLANNER_RELATIONSHIP_TYPE_LABELS: Record<
  PlannerRelationshipType,
  string
> = {
  related: "Related",
  supports_pillar: "Supports pillar",
  lead_magnet_for: "Lead magnet for",
  article_series: "Article series",
  newsletter_expansion: "Newsletter expansion",
  seo_cluster: "SEO cluster",
  repurposes: "Repurposes",
};

export const ROADMAP_STATUSES = ["draft", "active", "completed"] as const;
export type RoadmapStatus = (typeof ROADMAP_STATUSES)[number];

export const TOPIC_GENERATION_MODES = [
  "ebook_ideas",
  "article_ideas",
  "content_clusters",
  "lead_magnets",
  "seo_topic_maps",
  "niche_subtopics",
  "faq_opportunities",
] as const;

export type TopicGenerationMode = (typeof TOPIC_GENERATION_MODES)[number];

export const TOPIC_GENERATION_MODE_LABELS: Record<TopicGenerationMode, string> =
  {
    ebook_ideas: "Ebook ideas",
    article_ideas: "Article ideas",
    content_clusters: "Content clusters",
    lead_magnets: "Lead magnet ideas",
    seo_topic_maps: "SEO topic maps",
    niche_subtopics: "Niche subtopics",
    faq_opportunities: "FAQ opportunities",
  };

export function isPlannerIdeaType(value: string): value is PlannerIdeaType {
  return (PLANNER_IDEA_TYPES as readonly string[]).includes(value);
}

export function isPlannerWorkflowStatus(
  value: string,
): value is PlannerWorkflowStatus {
  return (PLANNER_WORKFLOW_STATUSES as readonly string[]).includes(value);
}

export function isPlannerEntityKind(value: string): value is PlannerEntityKind {
  return (PLANNER_ENTITY_KINDS as readonly string[]).includes(value);
}

export function isPlannerRelationshipType(
  value: string,
): value is PlannerRelationshipType {
  return (PLANNER_RELATIONSHIP_TYPES as readonly string[]).includes(value);
}

export function ideaTypeForGenerationMode(
  mode: TopicGenerationMode,
): PlannerIdeaType {
  const map: Record<TopicGenerationMode, PlannerIdeaType> = {
    ebook_ideas: "ebook_idea",
    article_ideas: "article_idea",
    content_clusters: "content_cluster",
    lead_magnets: "lead_magnet",
    seo_topic_maps: "seo_topic_map",
    niche_subtopics: "niche_subtopic",
    faq_opportunities: "faq_opportunity",
  };
  return map[mode];
}
