export const PROJECT_NOTE_TAGS = [
  "idea",
  "research",
  "quote",
  "example",
  "source",
  "reminder",
] as const;

export type ProjectNoteTag = (typeof PROJECT_NOTE_TAGS)[number];

export type ProjectNote = {
  id: string;
  projectId: string;
  chapterId: string | null;
  tag: ProjectNoteTag;
  title: string;
  body: string;
  sourceUrl: string | null;
  sourceSummary: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export const PROJECT_NOTE_TAG_LABELS: Record<ProjectNoteTag, string> = {
  idea: "Idea",
  research: "Research",
  quote: "Quote",
  example: "Example",
  source: "Source",
  reminder: "Reminder",
};
