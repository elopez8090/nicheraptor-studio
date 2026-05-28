import { createClient } from "@/lib/supabase/server";
import type { EbookWorkflowStatus } from "@/lib/ebooks/workflow-status";

/** Chapter-generation progress (derived from chapter rows). */
export type EbookProjectProgressStatus = "outline" | "in_progress" | "ready";

export type EbookProjectListItem = {
  id: string;
  title: string;
  audience: string;
  goal: string;
  coverImageUrl: string | null;
  createdAt: string;
  lastUpdatedAt: string;
  chapterCount: number;
  generatedCount: number;
  progressStatus: EbookProjectProgressStatus;
  workflowStatus: EbookWorkflowStatus;
  isStarred: boolean;
  isArchived: boolean;
  notes: string | null;
};

/** @deprecated Use progressStatus — kept for gradual migration */
export type EbookProjectStatus = EbookProjectProgressStatus;

export type EbookProjectLibraryStats = {
  total: number;
  drafts: number;
  completed: number;
  totalChapters: number;
  starred: number;
  archived: number;
};

export function computeEbookProjectLibraryStats(
  projects: EbookProjectListItem[],
): EbookProjectLibraryStats {
  const active = projects.filter((p) => !p.isArchived);
  return {
    total: active.length,
    drafts: active.filter((p) => p.workflowStatus !== "completed").length,
    completed: active.filter((p) => p.workflowStatus === "completed").length,
    totalChapters: active.reduce((sum, p) => sum + p.chapterCount, 0),
    starred: active.filter((p) => p.isStarred).length,
    archived: projects.filter((p) => p.isArchived).length,
  };
}

function deriveProgressStatus(
  chapterCount: number,
  generatedCount: number,
): EbookProjectProgressStatus {
  if (chapterCount === 0 || generatedCount === 0) {
    return "outline";
  }
  if (generatedCount < chapterCount) {
    return "in_progress";
  }
  return "ready";
}

export async function fetchEbookProjects(options?: {
  includeArchived?: boolean;
}): Promise<EbookProjectListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("ebook_projects")
    .select(
      "id, title, audience, goal, cover_image_url, created_at, updated_at, workflow_status, is_starred, is_archived, notes, ebook_chapters ( status, created_at )",
    )
    .order("is_starred", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!options?.includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data: projects, error } = await query;

  if (error || !projects) {
    return [];
  }

  return projects.map((row) => {
    const chapters = Array.isArray(row.ebook_chapters)
      ? row.ebook_chapters
      : [];
    const chapterCount = chapters.length;
    const generatedCount = chapters.filter(
      (ch: { status: string }) => ch.status === "generated",
    ).length;

    const activityTimestamps = [
      new Date(row.created_at).getTime(),
      new Date(row.updated_at ?? row.created_at).getTime(),
      ...chapters
        .map((ch: { created_at?: string }) => ch.created_at)
        .filter((value): value is string => typeof value === "string")
        .map((iso) => new Date(iso).getTime()),
    ];
    const lastUpdatedAt = new Date(Math.max(...activityTimestamps)).toISOString();

    const workflowStatus = (row.workflow_status ??
      "idea") as EbookWorkflowStatus;

    return {
      id: row.id,
      title: row.title,
      audience: row.audience,
      goal: row.goal,
      coverImageUrl: row.cover_image_url ?? null,
      createdAt: row.created_at,
      lastUpdatedAt,
      chapterCount,
      generatedCount,
      progressStatus: deriveProgressStatus(chapterCount, generatedCount),
      workflowStatus,
      isStarred: Boolean(row.is_starred),
      isArchived: Boolean(row.is_archived),
      notes: row.notes ?? null,
    };
  });
}
