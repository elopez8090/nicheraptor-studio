import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import {
  ebookLengthSettingsToDbRow,
  parseEbookLengthSettingsFromBody,
  type EbookLengthSettings,
} from "@/lib/ebooks/ebook-length-settings";
import { normalizeHumanScore, type HumanizationOptions } from "@/lib/ai/humanization/config";
import { normalizeWritingStyle, type WritingStyle } from "@/lib/ai/styles/writing-styles";
import type { OutlineChapterCountMode } from "@/lib/ebooks/outline-chapter-count";

export type OutlineToSave = {
  title: string;
  audience: string;
  goal: string;
  chapters: { title: string; summary: string }[];
  /** Optional generation prefs (Phase 14); parsed from save payload when present. */
  lengthSettings?: EbookLengthSettings;
  chapterCountMode?: OutlineChapterCountMode;
  requestedChapterCount?: number | null;
  writingStyle?: WritingStyle;
  humanScore?: string;
  humanizationOptions?: Partial<HumanizationOptions> | null;
};

export async function saveEbookOutlineWithClient(
  supabase: SupabaseClient,
  outline: OutlineToSave,
): Promise<{ projectId: string } | { error: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a project." };
  }

  const lengthSettings =
    outline.lengthSettings ?? parseEbookLengthSettingsFromBody(outline);
  const lengthRow = ebookLengthSettingsToDbRow(lengthSettings);
  const writingStyle = normalizeWritingStyle(outline.writingStyle);
  const humanScore = normalizeHumanScore(outline.humanScore);

  const { data: project, error: projectError } = await supabase
    .from("ebook_projects")
    .insert({
      title: outline.title,
      audience: outline.audience,
      goal: outline.goal,
      user_id: user.id,
      ...lengthRow,
      chapter_count_mode: outline.chapterCountMode ?? null,
      requested_chapter_count:
        outline.chapterCountMode === "fixed" &&
        typeof outline.requestedChapterCount === "number"
          ? outline.requestedChapterCount
          : null,
      writing_style: writingStyle,
      human_score: humanScore,
      humanization_options: outline.humanizationOptions ?? {},
    })
    .select("id")
    .single();

  if (projectError || !project) {
    return {
      error: projectError?.message ?? "Failed to save ebook project.",
    };
  }

  const chapterRows = outline.chapters.map((chapter, index) => ({
    project_id: project.id,
    position: index + 1,
    title: chapter.title,
    summary: chapter.summary,
    status: "not_generated",
    content: null,
  }));

  const { error: chaptersError } = await supabase
    .from("ebook_chapters")
    .insert(chapterRows);

  if (chaptersError) {
    return { error: chaptersError.message };
  }

  return { projectId: project.id };
}

export async function saveEbookOutline(
  outline: OutlineToSave,
): Promise<{ projectId: string } | { error: string }> {
  return saveEbookOutlineWithClient(createClient(), outline);
}
