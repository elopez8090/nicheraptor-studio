import { normalizeExportPresetId } from "@/lib/ebooks/export-presets";
import { fetchManuscriptPrintOptionsForUser } from "@/lib/ebooks/fetch-user-settings";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";
import { createClient } from "@/lib/supabase/server";

export type ProjectExportSettings = Partial<ManuscriptPrintOptions>;

function isPartialPrintOptions(value: unknown): value is ProjectExportSettings {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function mergePrintOptions(
  base: ManuscriptPrintOptions,
  override: ProjectExportSettings | null,
): ManuscriptPrintOptions {
  if (!override) {
    return base;
  }

  return {
    authorName:
      typeof override.authorName === "string" ? override.authorName : base.authorName,
    includeCover:
      typeof override.includeCover === "boolean" ? override.includeCover : base.includeCover,
    includeToc:
      typeof override.includeToc === "boolean" ? override.includeToc : base.includeToc,
    includeDisclaimer:
      typeof override.includeDisclaimer === "boolean"
        ? override.includeDisclaimer
        : base.includeDisclaimer,
    includeHeader:
      typeof override.includeHeader === "boolean"
        ? override.includeHeader
        : base.includeHeader,
    headerText:
      typeof override.headerText === "string" ? override.headerText : base.headerText,
    includeFooter:
      typeof override.includeFooter === "boolean"
        ? override.includeFooter
        : base.includeFooter,
    footerText:
      typeof override.footerText === "string" ? override.footerText : base.footerText,
    showPageNumbers:
      typeof override.showPageNumbers === "boolean"
        ? override.showPageNumbers
        : base.showPageNumbers,
    showEbookTitleInHeader:
      typeof override.showEbookTitleInHeader === "boolean"
        ? override.showEbookTitleInHeader
        : base.showEbookTitleInHeader,
    showAuthorNameInFooter:
      typeof override.showAuthorNameInFooter === "boolean"
        ? override.showAuthorNameInFooter
        : base.showAuthorNameInFooter,
    exportPreset: normalizeExportPresetId(
      override.exportPreset ?? base.exportPreset,
      base.exportPreset,
    ),
  };
}

export async function fetchProjectExportSettings(
  projectId: string,
): Promise<ProjectExportSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("ebook_projects")
    .select("export_settings")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data?.export_settings) {
    return null;
  }

  const raw = data.export_settings;
  return isPartialPrintOptions(raw) ? raw : null;
}

export async function fetchManuscriptPrintOptionsForProject(
  projectId: string,
): Promise<ManuscriptPrintOptions> {
  const userDefaults = await fetchManuscriptPrintOptionsForUser();
  const projectOverride = await fetchProjectExportSettings(projectId);
  return mergePrintOptions(userDefaults, projectOverride);
}

export async function saveProjectExportSettings(
  projectId: string,
  settings: ProjectExportSettings,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Unauthorized." };
  }

  const base = await fetchManuscriptPrintOptionsForUser();
  const merged = mergePrintOptions(base, settings);

  const { error } = await supabase
    .from("ebook_projects")
    .update({
      export_settings: merged,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
