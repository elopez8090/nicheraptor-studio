import { normalizeExportPresetId } from "@/lib/ebooks/export-presets";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  type DefaultExportFormat,
  type EbookStylePreset,
  type ExportPresetId,
  type UserWorkspaceSettings,
  type WritingTone,
} from "@/lib/ebooks/workspace-settings-types";
import { createClient } from "@/lib/supabase/server";

type SettingsRow = {
  default_author_name: string;
  default_writing_tone: WritingTone;
  default_ebook_style: EbookStylePreset;
  default_audience: string;
  default_export_format: DefaultExportFormat;
  export_include_cover: boolean;
  export_include_toc: boolean;
  export_include_disclaimer: boolean;
  export_include_header: boolean;
  export_header_text: string;
  export_include_footer: boolean;
  export_footer_text: string;
  export_show_page_numbers: boolean;
  export_show_ebook_title_in_header: boolean;
  export_show_author_name_in_footer: boolean;
  export_preset?: ExportPresetId;
};

function rowToSettings(row: SettingsRow): UserWorkspaceSettings {
  return {
    defaultAuthorName: row.default_author_name ?? "",
    defaultWritingTone: row.default_writing_tone,
    defaultEbookStyle: row.default_ebook_style,
    defaultAudience: row.default_audience ?? "",
    defaultExportFormat: row.default_export_format,
    exportIncludeCover: row.export_include_cover ?? true,
    exportIncludeToc: row.export_include_toc ?? true,
    exportIncludeDisclaimer: row.export_include_disclaimer ?? false,
    exportIncludeHeader: row.export_include_header ?? true,
    exportHeaderText: row.export_header_text ?? "",
    exportIncludeFooter: row.export_include_footer ?? true,
    exportFooterText: row.export_footer_text ?? "",
    exportShowPageNumbers: row.export_show_page_numbers ?? true,
    exportShowEbookTitleInHeader: row.export_show_ebook_title_in_header ?? true,
    exportShowAuthorNameInFooter: row.export_show_author_name_in_footer ?? true,
    exportPreset: normalizeExportPresetId(row.export_preset),
  };
}

export async function fetchUserWorkspaceSettings(): Promise<UserWorkspaceSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_WORKSPACE_SETTINGS;
  }

  const { data, error } = await supabase
    .from("user_workspace_settings")
    .select(
      "default_author_name, default_writing_tone, default_ebook_style, default_audience, default_export_format, export_include_cover, export_include_toc, export_include_disclaimer, export_include_header, export_header_text, export_include_footer, export_footer_text, export_show_page_numbers, export_show_ebook_title_in_header, export_show_author_name_in_footer, export_preset",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_WORKSPACE_SETTINGS;
  }

  return rowToSettings(data as SettingsRow);
}

export async function fetchManuscriptPrintOptionsForUser(): Promise<{
  authorName: string;
  includeCover: boolean;
  includeToc: boolean;
  includeDisclaimer: boolean;
  includeHeader: boolean;
  headerText: string;
  includeFooter: boolean;
  footerText: string;
  showPageNumbers: boolean;
  showEbookTitleInHeader: boolean;
  showAuthorNameInFooter: boolean;
  exportPreset: ExportPresetId;
}> {
  const settings = await fetchUserWorkspaceSettings();
  return {
    authorName: settings.defaultAuthorName,
    includeCover: settings.exportIncludeCover,
    includeToc: settings.exportIncludeToc,
    includeDisclaimer: settings.exportIncludeDisclaimer,
    includeHeader: settings.exportIncludeHeader,
    headerText: settings.exportHeaderText,
    includeFooter: settings.exportIncludeFooter,
    footerText: settings.exportFooterText,
    showPageNumbers: settings.exportShowPageNumbers,
    showEbookTitleInHeader: settings.exportShowEbookTitleInHeader,
    showAuthorNameInFooter: settings.exportShowAuthorNameInFooter,
    exportPreset: settings.exportPreset,
  };
}
