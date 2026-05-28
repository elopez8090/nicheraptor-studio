/**
 * @deprecated Import from `@/lib/generation/jobs-repository` instead.
 * Re-exports preserve older imports during the Phase 12 migration.
 */

export {
  getActiveGenerationJobForProject as getGenerationJob,
  getLatestGenerationJobForProject,
  getGenerationJobById,
  startGenerationJob,
  updateGenerationJob as updateGenerationJobProgress,
  requestCancelGenerationJob,
  isProjectGenerationCancelRequested as isGenerationCancelRequested,
  markGenerationJobFailed,
  markGenerationJobChapterCompleted,
  markGenerationJobChapterStarted,
} from "@/lib/generation/jobs-repository";

export type { GenerationJobRow as EbookGenerationJobRow } from "@/lib/generation/types";

export type GenerationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
