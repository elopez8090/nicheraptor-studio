import type { WritingStyle } from "@/lib/ai/styles/writing-styles";
import type { HumanScore } from "@/lib/ai/humanization/config";

export type ProjectMemoryKind = "ebook" | "article";

export type VoiceProfileId =
  | "concise"
  | "analytical"
  | "persuasive"
  | "storytelling"
  | "educational"
  | "direct_response";

export type ProjectMemoryPayload = {
  tone?: string;
  targetAudience?: string;
  writingStyle?: WritingStyle | string;
  humanizationLevel?: HumanScore | number;
  recurringConcepts?: string[];
  terminology?: Array<{ term: string; definition?: string }>;
  favoritePromptStyles?: string[];
  savedFrameworkNotes?: string;
  importantResearchThemes?: string[];
  /** Reserved for vector / RAG */
  memoryVersion?: number;
};

export type ChapterContentSummary = {
  id: string;
  projectId: string;
  chapterId: string;
  summary: string;
  keyConcepts: string[];
  terminology: Array<{ term: string; definition?: string }>;
  explainedTopics: string[];
  contentHash: string | null;
  updatedAt: string;
};

export type PriorChapterMemorySlice = {
  position: number;
  title: string;
  summary: string;
  keyConcepts: string[];
};

export type EmbeddingStatus = "none" | "pending" | "ready";

export type ProjectAiMemoryRecord = {
  id: string;
  userId: string;
  projectKind: ProjectMemoryKind;
  ebookProjectId: string | null;
  articleId: string | null;
  voiceProfile: VoiceProfileId | null;
  memory: ProjectMemoryPayload;
  embeddingStatus: EmbeddingStatus;
  embeddingMeta: Record<string, unknown>;
  updatedAt: string;
};
