import type { SupabaseClient } from "@supabase/supabase-js";

import type { AiQualityTier } from "@/lib/ebooks/ai-quality-settings";

import type {
  GenerationJobChapterPlanItem,
  GenerationJobRow,
  GenerationJobStatus,
} from "./types";

const JOB_COLUMNS =
  "id, project_id, user_id, status, current_step, total_steps, progress_percentage, error_message, quality, cancel_requested, failed_chapter_id, current_chapter_id, current_chapter_title, chapter_plan, tokens_used, started_at, completed_at, created_at";

function parseChapterPlan(value: unknown): GenerationJobChapterPlanItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is GenerationJobChapterPlanItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as GenerationJobChapterPlanItem).id === "string" &&
      typeof (item as GenerationJobChapterPlanItem).number === "number" &&
      typeof (item as GenerationJobChapterPlanItem).title === "string" &&
      typeof (item as GenerationJobChapterPlanItem).regenerate === "boolean",
  );
}

function mapRow(data: Record<string, unknown>): GenerationJobRow {
  return {
    ...(data as GenerationJobRow),
    chapter_plan: parseChapterPlan(data.chapter_plan),
  };
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes("generation_jobs") &&
    (message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("Could not find"))
  );
}

const memoryJobsByProject = new Map<string, GenerationJobRow>();

function progressForStep(currentStep: number, totalSteps: number): number {
  if (totalSteps <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((currentStep / totalSteps) * 100));
}

export async function getActiveGenerationJobForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<GenerationJobRow | null> {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select(JOB_COLUMNS)
    .eq("project_id", projectId)
    .in("status", ["pending", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return memoryJobsByProject.get(projectId) ?? null;
    }
    throw new Error(error.message);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getGenerationJobById(
  supabase: SupabaseClient,
  jobId: string,
): Promise<GenerationJobRow | null> {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select(JOB_COLUMNS)
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      for (const job of memoryJobsByProject.values()) {
        if (job.id === jobId) {
          return job;
        }
      }
      return null;
    }
    throw new Error(error.message);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getLatestGenerationJobForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<GenerationJobRow | null> {
  const { data, error } = await supabase
    .from("generation_jobs")
    .select(JOB_COLUMNS)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingTableError(error.message)) {
      return memoryJobsByProject.get(projectId) ?? null;
    }
    throw new Error(error.message);
  }

  return data ? mapRow(data as Record<string, unknown>) : null;
}

export type StartGenerationJobInput = {
  projectId: string;
  userId: string;
  quality: AiQualityTier;
  chapterPlan: GenerationJobChapterPlanItem[];
};

export async function startGenerationJob(
  supabase: SupabaseClient,
  input: StartGenerationJobInput,
): Promise<
  | { ok: true; job: GenerationJobRow }
  | {
      ok: false;
      reason: "already_running" | "db_error";
      message?: string;
    }
> {
  const active = await getActiveGenerationJobForProject(
    supabase,
    input.projectId,
  );
  if (active) {
    return { ok: false, reason: "already_running" };
  }

  const totalSteps = input.chapterPlan.length;
  const now = new Date().toISOString();

  const insertRow = {
    project_id: input.projectId,
    user_id: input.userId,
    status: "running" as GenerationJobStatus,
    current_step: 0,
    total_steps: totalSteps,
    progress_percentage: 0,
    error_message: null,
    quality: input.quality,
    cancel_requested: false,
    failed_chapter_id: null,
    current_chapter_id: null,
    current_chapter_title: null,
    chapter_plan: input.chapterPlan,
    tokens_used: 0,
    started_at: now,
    completed_at: null,
  };

  const { data, error } = await supabase
    .from("generation_jobs")
    .insert(insertRow)
    .select(JOB_COLUMNS)
    .single();

  if (error) {
    if (isMissingTableError(error.message)) {
      const job: GenerationJobRow = {
        ...insertRow,
        id: `mem-${input.projectId}`,
        created_at: now,
        started_at: now,
        completed_at: null,
      };
      memoryJobsByProject.set(input.projectId, job);
      return { ok: true, job };
    }
    if (error.code === "23505") {
      return { ok: false, reason: "already_running" };
    }
    return { ok: false, reason: "db_error", message: error.message };
  }

  return { ok: true, job: mapRow(data as Record<string, unknown>) };
}

export async function updateGenerationJob(
  supabase: SupabaseClient,
  jobId: string,
  patch: Partial<{
    status: GenerationJobStatus;
    current_step: number;
    total_steps: number;
    progress_percentage: number;
    error_message: string | null;
    cancel_requested: boolean;
    failed_chapter_id: string | null;
    current_chapter_id: string | null;
    current_chapter_title: string | null;
    tokens_used: number;
    started_at: string | null;
    completed_at: string | null;
  }>,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("generation_jobs")
    .select("project_id")
    .eq("id", jobId)
    .maybeSingle();

  if (fetchError && isMissingTableError(fetchError.message)) {
    for (const [projectId, job] of memoryJobsByProject.entries()) {
      if (job.id === jobId) {
        const total = patch.total_steps ?? job.total_steps;
        const step = patch.current_step ?? job.current_step;
        memoryJobsByProject.set(projectId, {
          ...job,
          ...patch,
          progress_percentage:
            patch.progress_percentage ??
            progressForStep(step, total),
        });
        return;
      }
    }
    return;
  }

  const { error } = await supabase
    .from("generation_jobs")
    .update(patch)
    .eq("id", jobId);

  if (error && isMissingTableError(error.message)) {
    return;
  }
  if (error) {
    throw new Error(error.message);
  }

  void existing;
}

export async function markGenerationJobChapterStarted(
  supabase: SupabaseClient,
  jobId: string,
  chapter: GenerationJobChapterPlanItem,
  stepIndex: number,
  totalSteps: number,
): Promise<void> {
  await updateGenerationJob(supabase, jobId, {
    status: "running",
    current_step: stepIndex,
    total_steps: totalSteps,
    progress_percentage: progressForStep(stepIndex, totalSteps),
    current_chapter_id: chapter.id,
    current_chapter_title: chapter.title,
    failed_chapter_id: null,
    error_message: null,
  });
}

export async function markGenerationJobChapterCompleted(
  supabase: SupabaseClient,
  job: GenerationJobRow,
  stepIndex: number,
  tokensDelta: number,
): Promise<void> {
  const total = job.total_steps;
  const completedStep = stepIndex + 1;
  await updateGenerationJob(supabase, job.id, {
    current_step: completedStep,
    progress_percentage: progressForStep(completedStep, total),
    tokens_used: (job.tokens_used ?? 0) + tokensDelta,
    failed_chapter_id: null,
    error_message: null,
  });
}

export async function markGenerationJobFailed(
  supabase: SupabaseClient,
  jobId: string,
  chapterId: string,
  errorMessage: string,
): Promise<void> {
  await updateGenerationJob(supabase, jobId, {
    status: "failed",
    failed_chapter_id: chapterId,
    error_message: errorMessage,
    completed_at: new Date().toISOString(),
  });
}

export async function markGenerationJobCompleted(
  supabase: SupabaseClient,
  jobId: string,
  totalSteps: number,
  tokensUsed?: number,
): Promise<void> {
  await updateGenerationJob(supabase, jobId, {
    status: "completed",
    current_step: totalSteps,
    total_steps: totalSteps,
    progress_percentage: 100,
    cancel_requested: false,
    failed_chapter_id: null,
    error_message: null,
    completed_at: new Date().toISOString(),
    ...(typeof tokensUsed === "number" ? { tokens_used: tokensUsed } : {}),
  });
}

export async function requestCancelGenerationJob(
  supabase: SupabaseClient,
  jobId: string,
): Promise<void> {
  await updateGenerationJob(supabase, jobId, {
    cancel_requested: true,
  });
}

export async function markGenerationJobCancelled(
  supabase: SupabaseClient,
  jobId: string,
): Promise<void> {
  await updateGenerationJob(supabase, jobId, {
    status: "cancelled",
    cancel_requested: true,
    completed_at: new Date().toISOString(),
  });
}

export async function isGenerationCancelRequested(
  supabase: SupabaseClient,
  jobId: string,
): Promise<boolean> {
  const job = await getGenerationJobById(supabase, jobId);
  return Boolean(job?.cancel_requested);
}

export async function isProjectGenerationCancelRequested(
  supabase: SupabaseClient,
  projectId: string,
): Promise<boolean> {
  const job = await getActiveGenerationJobForProject(supabase, projectId);
  if (job?.cancel_requested) {
    return true;
  }
  const latest = await getLatestGenerationJobForProject(supabase, projectId);
  return Boolean(
    latest?.status === "running" && latest.cancel_requested,
  );
}
