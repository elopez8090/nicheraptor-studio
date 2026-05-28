import type { SupabaseClient } from "@supabase/supabase-js";

import type { HumanScore } from "@/lib/ai/humanization/config";
import { normalizeWritingStyle } from "@/lib/ai/styles/writing-styles";
import type { ProjectMemoryPayload } from "@/lib/ai-memory/types";
import { upsertEbookProjectMemory } from "@/lib/ai-memory/project-memory-db";

export type EbookProjectMemorySource = {
  title: string;
  audience: string;
  goal: string;
  writing_style?: string | null;
  human_score?: HumanScore | null;
  notes?: string | null;
  niche?: string | null;
};

export function buildMemoryPayloadFromEbookProject(
  project: EbookProjectMemorySource,
): Partial<ProjectMemoryPayload> {
  const payload: Partial<ProjectMemoryPayload> = {
    targetAudience: project.audience,
    tone: project.goal,
    writingStyle: normalizeWritingStyle(project.writing_style),
    humanizationLevel: project.human_score ?? undefined,
  };

  if (project.niche?.trim()) {
    payload.recurringConcepts = [project.niche.trim()];
  }

  if (project.notes?.trim()) {
    payload.importantResearchThemes = [
      project.notes.trim().slice(0, 500),
    ];
  }

  return payload;
}

/** Keeps DB memory aligned with project settings without overwriting user-curated fields. */
export async function syncEbookProjectMemoryFromSettings(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectId: string;
    project: EbookProjectMemorySource;
  },
): Promise<void> {
  const patch = buildMemoryPayloadFromEbookProject(input.project);
  await upsertEbookProjectMemory(supabase, {
    userId: input.userId,
    projectId: input.projectId,
    memoryPatch: patch,
  });
}
