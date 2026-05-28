export const RESEARCH_ACTIONS = [
  "topic",
  "chapter",
  "statistics",
  "trends",
  "faqs",
  "examples",
] as const;

export type ResearchAction = (typeof RESEARCH_ACTIONS)[number];

export type ResearchEntryType =
  | ResearchAction
  | "manual_note";

export type ResearchSource = {
  url: string;
  title: string;
};

export type ResearchEntry = {
  id: string;
  projectId: string;
  chapterId: string | null;
  researchType: ResearchEntryType;
  title: string;
  summary: string;
  content: string;
  sources: ResearchSource[];
  createdAt: string;
  updatedAt: string;
};

export type ResearchProjectSettings = {
  includeSourceReferences: boolean;
};

export type ResearchRunResult = {
  entry: ResearchEntry;
};
