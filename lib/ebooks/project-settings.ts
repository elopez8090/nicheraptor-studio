import type { HumanScore } from "@/lib/ai/humanization/config";
import { normalizeHumanScore } from "@/lib/ai/humanization/config";
import { normalizeWritingStyle, type WritingStyle } from "@/lib/ai/styles/writing-styles";
import {
  CHAPTER_LENGTH_OPTIONS,
  WRITING_DEPTH_OPTIONS,
  ebookLengthSettingsFromDbRow,
  ebookLengthSettingsToDbRow,
  type ChapterLengthPreset,
  type EbookLengthSettings,
  type WritingDepthPreset,
} from "@/lib/ebooks/ebook-length-settings";
import { normalizeExportPresetId } from "@/lib/ebooks/export-presets";
import {
  fetchManuscriptPrintOptionsForProject,
  saveProjectExportSettings,
  type ProjectExportSettings,
} from "@/lib/ebooks/fetch-project-export-settings";
import {
  isExportPresetId,
  type ManuscriptPrintOptions,
} from "@/lib/ebooks/workspace-settings-types";
import { createClient } from "@/lib/supabase/server";

export type EbookProjectSettingsPayload = {
  title: string;
  subtitle: string;
  authorName: string;
  niche: string;
  audience: string;
  goal: string;
  writingStyle: WritingStyle;
  humanScore: HumanScore;
  chapterLength: ChapterLengthPreset;
  writingDepth: WritingDepthPreset;
  export: ManuscriptPrintOptions;
  isArchived: boolean;
};

type ProjectSettingsRow = {
  id: string;
  title: string;
  subtitle?: string | null;
  author_name?: string | null;
  niche?: string | null;
  audience: string;
  goal: string;
  writing_style?: string | null;
  human_score?: string | null;
  chapter_length?: string | null;
  writing_depth?: string | null;
  include_examples?: boolean | null;
  include_checklists?: boolean | null;
  include_summaries?: boolean | null;
  include_action_steps?: boolean | null;
  is_archived?: boolean | null;
};

const PROJECT_SETTINGS_SELECT =
  "id, title, subtitle, author_name, niche, audience, goal, is_archived, writing_style, human_score, chapter_length, writing_depth, include_examples, include_checklists, include_summaries, include_action_steps";

export async function fetchEbookProjectSettings(
  projectId: string,
): Promise<EbookProjectSettingsPayload | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let row: ProjectSettingsRow | null = null;

  const full = await supabase
    .from("ebook_projects")
    .select(PROJECT_SETTINGS_SELECT)
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!full.error && full.data) {
    row = full.data as ProjectSettingsRow;
  } else {
    const base = await supabase
      .from("ebook_projects")
      .select(
        "id, title, audience, goal, is_archived, writing_style, human_score, chapter_length, writing_depth, include_examples, include_checklists, include_summaries, include_action_steps",
      )
      .eq("id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (base.error || !base.data) {
      return null;
    }
    row = base.data as ProjectSettingsRow;
  }

  if (!row) {
    return null;
  }
  const length = ebookLengthSettingsFromDbRow(
    row as Parameters<typeof ebookLengthSettingsFromDbRow>[0],
  );
  const exportOptions = await fetchManuscriptPrintOptionsForProject(projectId);

  const authorName =
    (row.author_name?.trim() ?? "") || exportOptions.authorName.trim();

  return {
    title: row.title,
    subtitle: row.subtitle ?? "",
    authorName,
    niche: row.niche ?? "",
    audience: row.audience,
    goal: row.goal,
    writingStyle: normalizeWritingStyle(row.writing_style),
    humanScore: normalizeHumanScore(row.human_score),
    chapterLength: length.chapterLength,
    writingDepth: length.writingDepth,
    export: {
      ...exportOptions,
      authorName: authorName || exportOptions.authorName,
    },
    isArchived: Boolean(row.is_archived),
  };
}

function parseLengthFromPayload(
  payload: Pick<
    EbookProjectSettingsPayload,
    "chapterLength" | "writingDepth"
  >,
  existing: EbookLengthSettings,
): EbookLengthSettings {
  return {
    chapterLength: payload.chapterLength,
    writingDepth: payload.writingDepth,
    include: existing.include,
  };
}

function mergeExportOptions(
  base: ManuscriptPrintOptions,
  patch: Partial<ManuscriptPrintOptions> | undefined,
  authorName: string,
): ManuscriptPrintOptions {
  if (!patch) {
    return { ...base, authorName: authorName || base.authorName };
  }

  return {
    authorName: authorName || base.authorName,
    includeCover:
      typeof patch.includeCover === "boolean" ? patch.includeCover : base.includeCover,
    includeToc:
      typeof patch.includeToc === "boolean" ? patch.includeToc : base.includeToc,
    includeDisclaimer:
      typeof patch.includeDisclaimer === "boolean"
        ? patch.includeDisclaimer
        : base.includeDisclaimer,
    includeHeader:
      typeof patch.includeHeader === "boolean" ? patch.includeHeader : base.includeHeader,
    headerText:
      typeof patch.headerText === "string" ? patch.headerText : base.headerText,
    includeFooter:
      typeof patch.includeFooter === "boolean" ? patch.includeFooter : base.includeFooter,
    footerText:
      typeof patch.footerText === "string" ? patch.footerText : base.footerText,
    showPageNumbers:
      typeof patch.showPageNumbers === "boolean"
        ? patch.showPageNumbers
        : base.showPageNumbers,
    showEbookTitleInHeader:
      typeof patch.showEbookTitleInHeader === "boolean"
        ? patch.showEbookTitleInHeader
        : base.showEbookTitleInHeader,
    showAuthorNameInFooter:
      typeof patch.showAuthorNameInFooter === "boolean"
        ? patch.showAuthorNameInFooter
        : base.showAuthorNameInFooter,
    exportPreset: normalizeExportPresetId(
      patch.exportPreset ?? base.exportPreset,
      base.exportPreset,
    ),
  };
}

function isChapterLength(value: unknown): value is ChapterLengthPreset {
  return CHAPTER_LENGTH_OPTIONS.some((o) => o.value === value);
}

function isWritingDepth(value: unknown): value is WritingDepthPreset {
  return WRITING_DEPTH_OPTIONS.some((o) => o.value === value);
}

export function parseEbookProjectSettingsBody(
  body: unknown,
  existing: EbookProjectSettingsPayload,
): EbookProjectSettingsPayload | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid JSON body." };
  }

  const input = body as Partial<EbookProjectSettingsPayload>;
  const base = existing;

  const title =
    typeof input.title === "string" ? input.title.trim() : base.title;
  if (!title) {
    return { error: "Title is required." };
  }

  const audience =
    typeof input.audience === "string" ? input.audience.trim() : base.audience;
  const goal = typeof input.goal === "string" ? input.goal.trim() : base.goal;
  if (!audience || !goal) {
    return { error: "Audience and goal are required." };
  }

  const exportInput = input.export;
  if (exportInput !== undefined && (typeof exportInput !== "object" || !exportInput)) {
    return { error: "Invalid export settings." };
  }

  if (
    exportInput &&
    exportInput.exportPreset !== undefined &&
    !isExportPresetId(exportInput.exportPreset)
  ) {
    return { error: "Invalid export preset." };
  }

  const authorName =
    typeof input.authorName === "string" ? input.authorName.trim() : base.authorName;

  const chapterLength = isChapterLength(input.chapterLength)
    ? input.chapterLength
    : base.chapterLength;
  const writingDepth = isWritingDepth(input.writingDepth)
    ? input.writingDepth
    : base.writingDepth;

  return {
    title,
    subtitle:
      typeof input.subtitle === "string" ? input.subtitle.trim() : base.subtitle,
    authorName,
    niche: typeof input.niche === "string" ? input.niche.trim() : base.niche,
    audience,
    goal,
    writingStyle: normalizeWritingStyle(input.writingStyle ?? base.writingStyle),
    humanScore: normalizeHumanScore(input.humanScore ?? base.humanScore),
    chapterLength,
    writingDepth,
    export: mergeExportOptions(
      base.export,
      exportInput as Partial<ManuscriptPrintOptions> | undefined,
      authorName,
    ),
    isArchived: base.isArchived,
  };
}

export async function saveEbookProjectSettings(
  projectId: string,
  payload: EbookProjectSettingsPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized." };
  }

  const { data: existingRow, error: loadError } = await supabase
    .from("ebook_projects")
    .select(
      "include_examples, include_checklists, include_summaries, include_action_steps, chapter_length, writing_depth",
    )
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (loadError || !existingRow) {
    return { ok: false, error: "Project not found." };
  }

  const lengthExisting = ebookLengthSettingsFromDbRow(
    existingRow as Parameters<typeof ebookLengthSettingsFromDbRow>[0],
  );
  const lengthSettings = parseLengthFromPayload(payload, lengthExisting);
  const lengthRow = ebookLengthSettingsToDbRow(lengthSettings);

  const { error: updateError } = await supabase
    .from("ebook_projects")
    .update({
      title: payload.title,
      subtitle: payload.subtitle,
      author_name: payload.authorName,
      niche: payload.niche,
      audience: payload.audience,
      goal: payload.goal,
      writing_style: payload.writingStyle,
      human_score: payload.humanScore,
      ...lengthRow,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  const exportPatch: ProjectExportSettings = {
    ...payload.export,
    authorName: payload.authorName,
  };

  const exportResult = await saveProjectExportSettings(projectId, exportPatch);
  if (!exportResult.ok) {
    return exportResult;
  }

  return { ok: true };
}
