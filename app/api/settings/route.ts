import { NextResponse } from "next/server";

import { normalizeExportPresetId } from "@/lib/ebooks/export-presets";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  isDefaultExportFormat,
  isEbookStylePreset,
  isExportPresetId,
  isWritingTone,
  type UserWorkspaceSettings,
} from "@/lib/ebooks/workspace-settings-types";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_workspace_settings")
    .select(
      "default_author_name, default_writing_tone, default_ebook_style, default_audience, default_export_format, export_include_cover, export_include_toc, export_include_disclaimer, export_include_header, export_header_text, export_include_footer, export_footer_text, export_show_page_numbers, export_show_ebook_title_in_header, export_show_author_name_in_footer, export_preset",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to load settings.", details: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(DEFAULT_WORKSPACE_SETTINGS);
  }

  const settings: UserWorkspaceSettings = {
    defaultAuthorName: data.default_author_name ?? "",
    defaultWritingTone: data.default_writing_tone,
    defaultEbookStyle: data.default_ebook_style,
    defaultAudience: data.default_audience ?? "",
    defaultExportFormat: data.default_export_format,
    exportIncludeCover: data.export_include_cover ?? true,
    exportIncludeToc: data.export_include_toc ?? true,
    exportIncludeDisclaimer: data.export_include_disclaimer ?? false,
    exportIncludeHeader: data.export_include_header ?? true,
    exportHeaderText: data.export_header_text ?? "",
    exportIncludeFooter: data.export_include_footer ?? true,
    exportFooterText: data.export_footer_text ?? "",
    exportShowPageNumbers: data.export_show_page_numbers ?? true,
    exportShowEbookTitleInHeader: data.export_show_ebook_title_in_header ?? true,
    exportShowAuthorNameInFooter: data.export_show_author_name_in_footer ?? true,
    exportPreset: normalizeExportPresetId(data.export_preset),
  };

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const input = body as Partial<UserWorkspaceSettings>;

  if (
    input.defaultWritingTone !== undefined &&
    !isWritingTone(input.defaultWritingTone)
  ) {
    return NextResponse.json({ error: "Invalid writing tone." }, { status: 400 });
  }

  if (
    input.defaultEbookStyle !== undefined &&
    !isEbookStylePreset(input.defaultEbookStyle)
  ) {
    return NextResponse.json({ error: "Invalid ebook style." }, { status: 400 });
  }

  if (
    input.defaultExportFormat !== undefined &&
    !isDefaultExportFormat(input.defaultExportFormat)
  ) {
    return NextResponse.json(
      { error: "Invalid export format." },
      { status: 400 },
    );
  }

  if (input.exportPreset !== undefined && !isExportPresetId(input.exportPreset)) {
    return NextResponse.json({ error: "Invalid export preset." }, { status: 400 });
  }

  const row = {
    user_id: user.id,
    default_author_name:
      typeof input.defaultAuthorName === "string"
        ? input.defaultAuthorName
        : DEFAULT_WORKSPACE_SETTINGS.defaultAuthorName,
    default_writing_tone:
      input.defaultWritingTone ?? DEFAULT_WORKSPACE_SETTINGS.defaultWritingTone,
    default_ebook_style:
      input.defaultEbookStyle ?? DEFAULT_WORKSPACE_SETTINGS.defaultEbookStyle,
    default_audience:
      typeof input.defaultAudience === "string"
        ? input.defaultAudience
        : DEFAULT_WORKSPACE_SETTINGS.defaultAudience,
    default_export_format:
      input.defaultExportFormat ??
      DEFAULT_WORKSPACE_SETTINGS.defaultExportFormat,
    export_include_cover:
      typeof input.exportIncludeCover === "boolean"
        ? input.exportIncludeCover
        : DEFAULT_WORKSPACE_SETTINGS.exportIncludeCover,
    export_include_toc:
      typeof input.exportIncludeToc === "boolean"
        ? input.exportIncludeToc
        : DEFAULT_WORKSPACE_SETTINGS.exportIncludeToc,
    export_include_disclaimer:
      typeof input.exportIncludeDisclaimer === "boolean"
        ? input.exportIncludeDisclaimer
        : DEFAULT_WORKSPACE_SETTINGS.exportIncludeDisclaimer,
    export_include_header:
      typeof input.exportIncludeHeader === "boolean"
        ? input.exportIncludeHeader
        : DEFAULT_WORKSPACE_SETTINGS.exportIncludeHeader,
    export_header_text:
      typeof input.exportHeaderText === "string"
        ? input.exportHeaderText
        : DEFAULT_WORKSPACE_SETTINGS.exportHeaderText,
    export_include_footer:
      typeof input.exportIncludeFooter === "boolean"
        ? input.exportIncludeFooter
        : DEFAULT_WORKSPACE_SETTINGS.exportIncludeFooter,
    export_footer_text:
      typeof input.exportFooterText === "string"
        ? input.exportFooterText
        : DEFAULT_WORKSPACE_SETTINGS.exportFooterText,
    export_show_page_numbers:
      typeof input.exportShowPageNumbers === "boolean"
        ? input.exportShowPageNumbers
        : DEFAULT_WORKSPACE_SETTINGS.exportShowPageNumbers,
    export_show_ebook_title_in_header:
      typeof input.exportShowEbookTitleInHeader === "boolean"
        ? input.exportShowEbookTitleInHeader
        : DEFAULT_WORKSPACE_SETTINGS.exportShowEbookTitleInHeader,
    export_show_author_name_in_footer:
      typeof input.exportShowAuthorNameInFooter === "boolean"
        ? input.exportShowAuthorNameInFooter
        : DEFAULT_WORKSPACE_SETTINGS.exportShowAuthorNameInFooter,
    export_preset:
      input.exportPreset ?? DEFAULT_WORKSPACE_SETTINGS.exportPreset,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_workspace_settings")
    .upsert(row, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json(
      { error: "Failed to save settings.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    defaultAuthorName: row.default_author_name,
    defaultWritingTone: row.default_writing_tone,
    defaultEbookStyle: row.default_ebook_style,
    defaultAudience: row.default_audience,
    defaultExportFormat: row.default_export_format,
    exportIncludeCover: row.export_include_cover,
    exportIncludeToc: row.export_include_toc,
    exportIncludeDisclaimer: row.export_include_disclaimer,
    exportIncludeHeader: row.export_include_header,
    exportHeaderText: row.export_header_text,
    exportIncludeFooter: row.export_include_footer,
    exportFooterText: row.export_footer_text,
    exportShowPageNumbers: row.export_show_page_numbers,
    exportShowEbookTitleInHeader: row.export_show_ebook_title_in_header,
    exportShowAuthorNameInFooter: row.export_show_author_name_in_footer,
    exportPreset: row.export_preset,
  });
}
