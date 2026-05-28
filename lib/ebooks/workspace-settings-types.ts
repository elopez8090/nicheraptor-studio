import {
  WRITING_STYLE_OPTIONS,
  isWritingStyle,
  normalizeWritingStyle,
  type WritingStyle,
} from "@/lib/ai/styles/writing-styles";
import {
  DEFAULT_EXPORT_PRESET_ID,
  type ExportPresetId,
  isExportPresetId,
} from "@/lib/ebooks/export-presets";

export const WRITING_TONE_OPTIONS = WRITING_STYLE_OPTIONS;

export type WritingTone = WritingStyle;

export const EBOOK_STYLE_OPTIONS = [
  { value: "how-to-guide", label: "How-To Guide" },
  { value: "beginners-guide", label: "Beginner's Guide" },
  { value: "checklist-ebook", label: "Checklist Ebook" },
  { value: "problem-solution", label: "Problem / Solution" },
  { value: "local-business-lead-magnet", label: "Local Business Lead Magnet" },
  { value: "authority-expert-guide", label: "Authority / Expert Guide" },
  { value: "product-buyers-guide", label: "Product Buyer's Guide" },
  { value: "niche-report", label: "Niche Report" },
  { value: "custom", label: "Custom (no template bias)" },
] as const;

export type EbookStylePreset = (typeof EBOOK_STYLE_OPTIONS)[number]["value"];

export const EXPORT_FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "Word (DOCX)" },
  { value: "markdown", label: "Markdown" },
] as const;

export type DefaultExportFormat = (typeof EXPORT_FORMAT_OPTIONS)[number]["value"];

export type UserWorkspaceSettings = {
  defaultAuthorName: string;
  defaultWritingTone: WritingTone;
  defaultEbookStyle: EbookStylePreset;
  defaultAudience: string;
  defaultExportFormat: DefaultExportFormat;
  exportIncludeCover: boolean;
  exportIncludeToc: boolean;
  exportIncludeDisclaimer: boolean;
  exportIncludeHeader: boolean;
  exportHeaderText: string;
  exportIncludeFooter: boolean;
  exportFooterText: string;
  exportShowPageNumbers: boolean;
  exportShowEbookTitleInHeader: boolean;
  exportShowAuthorNameInFooter: boolean;
  exportPreset: ExportPresetId;
};

export type { ExportPresetId };
export { isExportPresetId };

export const DEFAULT_WORKSPACE_SETTINGS: UserWorkspaceSettings = {
  defaultAuthorName: "",
  defaultWritingTone: "conversational",
  defaultEbookStyle: "how-to-guide",
  defaultAudience: "",
  defaultExportFormat: "pdf",
  exportIncludeCover: true,
  exportIncludeToc: true,
  exportIncludeDisclaimer: false,
  exportIncludeHeader: true,
  exportHeaderText: "",
  exportIncludeFooter: true,
  exportFooterText: "",
  exportShowPageNumbers: true,
  exportShowEbookTitleInHeader: true,
  exportShowAuthorNameInFooter: true,
  exportPreset: DEFAULT_EXPORT_PRESET_ID,
};

export type ManuscriptPrintOptions = {
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
};

export function isWritingTone(value: unknown): value is WritingTone {
  return isWritingStyle(value);
}

export function normalizeWritingTone(
  value: unknown,
  fallback: WritingTone = "conversational",
): WritingTone {
  return normalizeWritingStyle(value, fallback);
}

export function isEbookStylePreset(value: unknown): value is EbookStylePreset {
  return EBOOK_STYLE_OPTIONS.some((o) => o.value === value);
}

export function isDefaultExportFormat(value: unknown): value is DefaultExportFormat {
  return EXPORT_FORMAT_OPTIONS.some((o) => o.value === value);
}
