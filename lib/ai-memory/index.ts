export type {
  ChapterContentSummary,
  PriorChapterMemorySlice,
  ProjectAiMemoryRecord,
  ProjectMemoryKind,
  ProjectMemoryPayload,
  VoiceProfileId,
} from "@/lib/ai-memory/types";
export { VOICE_PROFILE_IDS, isVoiceProfileId, voiceProfilePromptLine } from "@/lib/ai-memory/voice-profiles";
export {
  fetchEbookProjectMemory,
  fetchArticleProjectMemory,
  upsertEbookProjectMemory,
  upsertArticleProjectMemory,
} from "@/lib/ai-memory/project-memory-db";
export {
  fetchChapterSummary,
  fetchPriorChapterSummaries,
  upsertChapterSummary,
} from "@/lib/ai-memory/chapter-summaries-db";
export {
  ensurePriorChapterSummaries,
  refreshChapterSummaryAfterGeneration,
} from "@/lib/ai-memory/ensure-chapter-summaries";
export {
  formatLibrarySnippetsBlock,
  formatPriorChaptersSummaryBlock,
  formatProjectMemoryBlock,
  formatProjectNotesBlock,
} from "@/lib/ai-memory/format-memory-for-prompt";
export { syncEbookProjectMemoryFromSettings } from "@/lib/ai-memory/sync-memory-from-project";
