import type { AiQualityTier } from "@/lib/ebooks/ai-quality-settings";

export type GenerationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type GenerationJobChapterPlanItem = {
  id: string;
  number: number;
  title: string;
  regenerate: boolean;
};

export type GenerationJobRow = {
  id: string;
  project_id: string;
  user_id: string;
  status: GenerationJobStatus;
  current_step: number;
  total_steps: number;
  progress_percentage: number;
  error_message: string | null;
  quality: AiQualityTier;
  cancel_requested: boolean;
  failed_chapter_id: string | null;
  current_chapter_id: string | null;
  current_chapter_title: string | null;
  chapter_plan: GenerationJobChapterPlanItem[];
  tokens_used: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type GenerationJobPublicView = {
  id: string;
  projectId: string;
  status: GenerationJobStatus;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  errorMessage: string | null;
  quality: AiQualityTier;
  cancelRequested: boolean;
  failedChapterId: string | null;
  currentChapterId: string | null;
  currentChapterTitle: string | null;
  chapterPlan: GenerationJobChapterPlanItem[];
  tokensUsed: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

export function toGenerationJobPublicView(
  row: GenerationJobRow,
): GenerationJobPublicView {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    currentStep: row.current_step,
    totalSteps: row.total_steps,
    progressPercentage: row.progress_percentage,
    errorMessage: row.error_message,
    quality: row.quality,
    cancelRequested: row.cancel_requested,
    failedChapterId: row.failed_chapter_id,
    currentChapterId: row.current_chapter_id,
    currentChapterTitle: row.current_chapter_title,
    chapterPlan: row.chapter_plan,
    tokensUsed: row.tokens_used,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
