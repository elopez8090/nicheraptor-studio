export const EXPORT_PRESET_OPTIONS = [
  { value: "clean-professional", label: "Clean Professional" },
  { value: "modern-guide", label: "Modern Guide" },
  { value: "minimalist", label: "Minimalist" },
  { value: "workbook-style", label: "Workbook Style" },
  { value: "premium-report", label: "Premium Report" },
] as const;

export type ExportPresetId = (typeof EXPORT_PRESET_OPTIONS)[number]["value"];

export const DEFAULT_EXPORT_PRESET_ID: ExportPresetId = "clean-professional";

export function isExportPresetId(value: unknown): value is ExportPresetId {
  return EXPORT_PRESET_OPTIONS.some((o) => o.value === value);
}

export function normalizeExportPresetId(
  value: unknown,
  fallback: ExportPresetId = DEFAULT_EXPORT_PRESET_ID,
): ExportPresetId {
  return isExportPresetId(value) ? value : fallback;
}

/**
 * Visual overrides per preset. Scoped under `.export-preset--{id}` on `.manuscript-page`.
 */
export function getExportPresetCss(presetId: ExportPresetId): string {
  switch (presetId) {
    case "modern-guide":
      return `
  .export-preset--modern-guide {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    color: #0f172a;
  }
  .export-preset--modern-guide .title-kicker,
  .export-preset--modern-guide .chapter-kicker {
    color: #2563eb;
    letter-spacing: 0.18em;
  }
  .export-preset--modern-guide .title-main {
    font-size: 2.15rem;
    font-weight: 700;
  }
  .export-preset--modern-guide .toc-heading {
    font-size: 1.5rem;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 0.5rem;
  }
  .export-preset--modern-guide .toc-item {
    border-bottom-color: #e2e8f0;
    padding: 0.65rem 0;
  }
  .export-preset--modern-guide .toc-number {
    color: #2563eb;
    min-width: 5.5rem;
  }
  .export-preset--modern-guide .chapter {
    padding-top: 2rem;
  }
  .export-preset--modern-guide .chapter-title {
    font-size: 1.55rem;
    border-left: 4px solid #2563eb;
    padding-left: 0.85rem;
    margin-bottom: 1.4rem;
  }
  .export-preset--modern-guide .chapter-body h1 { font-size: 1.35rem; color: #1e3a8a; }
  .export-preset--modern-guide .chapter-body h2 { font-size: 1.15rem; color: #1e40af; }
  .export-preset--modern-guide .chapter-body h3 { font-size: 1.05rem; }
  .export-preset--modern-guide .chapter-body p { margin-bottom: 0.85rem; }
  .export-preset--modern-guide .chapter-body blockquote {
    border-left: 4px solid #93c5fd;
    background: #f8fafc;
    padding: 0.65rem 1rem;
    border-radius: 0 6px 6px 0;
    color: #334155;
  }
  .export-preset--modern-guide .chapter-print-header {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    border-bottom-color: #cbd5e1;
  }
  .export-preset--modern-guide .chapter-print-footer {
    font-size: 0.68rem;
    color: #64748b;
    border-top-color: #cbd5e1;
  }
`;
    case "minimalist":
      return `
  .export-preset--minimalist {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #171717;
  }
  .export-preset--minimalist .title-kicker,
  .export-preset--minimalist .chapter-kicker {
    letter-spacing: 0.08em;
    color: #a3a3a3;
    font-weight: 500;
  }
  .export-preset--minimalist .title-main {
    font-size: 1.75rem;
    font-weight: 500;
    letter-spacing: 0;
  }
  .export-preset--minimalist .toc-heading {
    font-size: 1.25rem;
    font-weight: 500;
    margin-bottom: 1.25rem;
  }
  .export-preset--minimalist .toc-item {
    border-bottom: none;
    padding: 0.35rem 0;
  }
  .export-preset--minimalist .toc-number {
    display: none;
  }
  .export-preset--minimalist .toc-item::before {
    content: counter(toc) ". ";
    counter-increment: toc;
    color: #a3a3a3;
    font-size: 0.85rem;
  }
  .export-preset--minimalist .toc-list {
    counter-reset: toc;
  }
  .export-preset--minimalist .chapter {
    padding-top: 3rem;
  }
  .export-preset--minimalist .chapter-title {
    font-size: 1.2rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
  }
  .export-preset--minimalist .chapter-body h1,
  .export-preset--minimalist .chapter-body h2,
  .export-preset--minimalist .chapter-body h3 {
    font-weight: 500;
    margin-top: 1.5rem;
  }
  .export-preset--minimalist .chapter-body h1 { font-size: 1.15rem; }
  .export-preset--minimalist .chapter-body h2 { font-size: 1.05rem; }
  .export-preset--minimalist .chapter-body h3 { font-size: 1rem; }
  .export-preset--minimalist .chapter-body p { margin-bottom: 0.65rem; }
  .export-preset--minimalist .chapter-body blockquote {
    border-left: 1px solid #d4d4d4;
    padding-left: 0.75rem;
    color: #525252;
    font-style: normal;
  }
  .export-preset--minimalist .chapter-print-header,
  .export-preset--minimalist .chapter-print-footer {
    border: none;
    color: #a3a3a3;
    font-size: 0.65rem;
    padding-top: 0;
    padding-bottom: 0.25rem;
  }
`;
    case "workbook-style":
      return `
  .export-preset--workbook-style {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #1c1917;
  }
  .export-preset--workbook-style .title-kicker,
  .export-preset--workbook-style .chapter-kicker {
    color: #b45309;
    background: #fffbeb;
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    letter-spacing: 0.1em;
  }
  .export-preset--workbook-style .title-main {
    font-size: 2rem;
    font-weight: 700;
  }
  .export-preset--workbook-style .toc-page {
    background: #fafaf9;
    margin: 0 -2rem 2rem;
    padding: 2.5rem 2rem;
    border: 2px dashed #d6d3d1;
    border-radius: 8px;
  }
  .export-preset--workbook-style .toc-heading {
    font-size: 1.4rem;
    color: #b45309;
  }
  .export-preset--workbook-style .toc-item {
    border-bottom: 1px solid #e7e5e4;
    background: #fff;
    margin-bottom: 0.35rem;
    padding: 0.6rem 0.5rem;
    border-radius: 4px;
  }
  .export-preset--workbook-style .chapter {
    padding-top: 1.75rem;
    border-top: 3px solid #fbbf24;
    margin-top: 0.5rem;
  }
  .export-preset--workbook-style .chapter-title {
    font-size: 1.45rem;
    background: #fffbeb;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    margin-bottom: 1.1rem;
  }
  .export-preset--workbook-style .chapter-body h1,
  .export-preset--workbook-style .chapter-body h2 {
    color: #92400e;
  }
  .export-preset--workbook-style .chapter-body h1 { font-size: 1.3rem; }
  .export-preset--workbook-style .chapter-body h2 { font-size: 1.15rem; }
  .export-preset--workbook-style .chapter-body blockquote {
    border: 2px solid #fcd34d;
    border-left-width: 6px;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    background: #fffbeb;
    color: #44403c;
  }
  .export-preset--workbook-style .chapter-print-header {
    background: #fafaf9;
    padding: 0.4rem 0.5rem;
    border-radius: 4px;
    border-bottom: 1px solid #e7e5e4;
    font-weight: 600;
    color: #78716c;
  }
  .export-preset--workbook-style .chapter-print-footer {
    border-top: 2px dotted #d6d3d1;
    font-weight: 500;
    color: #78716c;
  }
`;
    case "premium-report":
      return `
  .export-preset--premium-report {
    font-family: "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
    font-size: 10.75pt;
    line-height: 1.62;
    color: #0c0a09;
  }
  .export-preset--premium-report .title-kicker,
  .export-preset--premium-report .chapter-kicker {
    color: #78716c;
    letter-spacing: 0.28em;
    font-size: 0.6rem;
  }
  .export-preset--premium-report .title-main {
    font-size: 2.25rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    text-transform: none;
  }
  .export-preset--premium-report .toc-heading {
    font-size: 1.85rem;
    font-weight: 400;
    text-align: center;
    margin-bottom: 2rem;
  }
  .export-preset--premium-report .toc-item {
    border-bottom: none;
    padding: 0.5rem 0;
    justify-content: center;
    text-align: center;
    flex-direction: column;
    gap: 0.15rem;
  }
  .export-preset--premium-report .toc-number {
    font-size: 0.7rem;
    min-width: auto;
  }
  .export-preset--premium-report .toc-title {
    font-size: 1.05rem;
    font-style: italic;
  }
  .export-preset--premium-report .chapter {
    padding-top: 2.25rem;
  }
  .export-preset--premium-report .chapter-title {
    font-size: 1.5rem;
    font-weight: 400;
    text-align: center;
    border-bottom: 1px solid #a8a29e;
    padding-bottom: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .export-preset--premium-report .chapter-kicker {
    text-align: center;
    display: block;
  }
  .export-preset--premium-report .chapter-body h1 {
    font-size: 1.35rem;
    font-weight: 400;
    text-align: center;
    margin-top: 1.75rem;
  }
  .export-preset--premium-report .chapter-body h2 { font-size: 1.15rem; font-weight: 600; }
  .export-preset--premium-report .chapter-body h3 { font-size: 1.05rem; }
  .export-preset--premium-report .chapter-body blockquote {
    margin: 1rem 2rem;
    padding: 0.5rem 0;
    border-left: none;
    border-top: 1px solid #d6d3d1;
    border-bottom: 1px solid #d6d3d1;
    text-align: center;
    font-style: italic;
    color: #57534e;
  }
  .export-preset--premium-report .chapter-print-header {
    text-align: center;
    font-size: 0.7rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #78716c;
    border-bottom: 1px solid #a8a29e;
  }
  .export-preset--premium-report .chapter-print-footer {
    font-size: 0.7rem;
    color: #78716c;
    border-top: 1px solid #a8a29e;
    justify-content: center;
  }
  .export-preset--premium-report .chapter-print-footer-text {
    flex: none;
    text-align: center;
    width: 100%;
  }
  .export-preset--premium-report .chapter-print-page-number {
    position: absolute;
    right: 0;
  }
  .export-preset--premium-report .chapter-print-footer {
    position: relative;
  }
`;
    case "clean-professional":
    default:
      return `
  .export-preset--clean-professional {
    /* Base styles in manuscript-print-styles.ts */
  }
`;
  }
}

export function exportPresetClassName(presetId: ExportPresetId): string {
  return `export-preset export-preset--${presetId}`;
}
