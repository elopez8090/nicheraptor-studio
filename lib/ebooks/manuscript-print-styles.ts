import { getExportPresetCss, normalizeExportPresetId } from "@/lib/ebooks/export-presets";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";

/** Shared print/PDF typography for manuscript HTML (TipTap output). */
const BASE_MANUSCRIPT_PRINT_CSS = `
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
  }
  body {
    font-family: Georgia, "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.65;
    color: #1a1a1a;
    background: #f4f4f5;
  }
  .manuscript-shell {
    max-width: 46rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
  }
  .manuscript-page {
    background: #fff;
    padding: 2.75rem 2.5rem;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
    border-radius: 4px;
  }
  .cover-page {
    position: relative;
    margin: -2.25rem -2rem 2.5rem;
    padding: 0;
    min-height: 70vh;
    border-radius: 4px;
    overflow: hidden;
    background: #020617;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }
  .cover-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .title-page {
    text-align: center;
    padding: 3rem 1rem 4rem;
    min-height: 70vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .title-kicker {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #6b7280;
    margin: 0 0 1.25rem;
  }
  .title-main {
    font-size: 2rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0;
    color: #111827;
  }
  .title-author {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 1rem;
    margin: 1.25rem 0 0;
    color: #4b5563;
  }
  .cover-overlay {
    position: absolute;
    inset: auto 0 0 0;
    padding: 2rem 1.5rem 2.5rem;
    background: linear-gradient(transparent, rgba(2, 6, 23, 0.92));
    color: #f9fafb;
    text-align: center;
  }
  .cover-title {
    font-size: 1.65rem;
    font-weight: 600;
    margin: 0;
    line-height: 1.25;
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.45);
  }
  .cover-overlay .title-author {
    color: #e5e7eb;
    margin-top: 0.65rem;
  }
  .toc-page {
    padding: 2.75rem 0 2.5rem;
    page-break-after: always;
  }
  .toc-heading {
    font-size: 1.7rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0 0 1.6rem;
    color: #111827;
  }
  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .toc-item {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
    padding: 0.55rem 0;
    border-bottom: 1px dotted #d1d5db;
    font-size: 1rem;
  }
  .toc-number {
    flex-shrink: 0;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6b7280;
    min-width: 6.4rem;
  }
  .toc-title {
    color: #111827;
    line-height: 1.45;
  }
  .legal-page {
    padding: 3rem 0 2rem;
    page-break-before: always;
    font-size: 0.85rem;
    color: #374151;
  }
  .legal-heading {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: #111827;
  }
  .legal-author {
    font-weight: 600;
    margin: 0 0 0.5rem;
  }
  .legal-title {
    margin: 0 0 1rem;
  }
  .legal-body {
    margin: 0;
    line-height: 1.6;
  }
  .chapter {
    padding-top: 2.5rem;
  }
  .chapter-print-header,
  .chapter-print-footer {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 0.72rem;
    line-height: 1.4;
    color: #4b5563;
  }
  .chapter-print-header {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 0.5rem;
    margin-bottom: 1.25rem;
  }
  .chapter-print-footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 0.5rem;
    margin-top: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .chapter-print-footer-text {
    flex: 1 1 auto;
  }
  .chapter-print-page-number {
    white-space: nowrap;
    flex-shrink: 0;
  }
  .chapter-kicker {
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 0.65rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #6b7280;
    margin: 0 0 0.35rem;
  }
  .chapter-title {
    font-size: 1.35rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    margin: 0 0 1.25rem;
    color: #111827;
    line-height: 1.25;
  }
  .chapter-body h1 { font-size: 1.5rem; margin: 1.25rem 0 0.65rem; font-weight: 600; }
  .chapter-body h2 { font-size: 1.25rem; margin: 1.15rem 0 0.55rem; font-weight: 600; }
  .chapter-body h3 { font-size: 1.1rem; margin: 1rem 0 0.5rem; font-weight: 600; }
  .chapter-body h4,
  .chapter-body h5,
  .chapter-body h6 { font-size: 1rem; margin: 0.85rem 0 0.45rem; font-weight: 600; }
  .chapter-body p {
    margin: 0 0 0.75rem;
  }
  .chapter-body p:last-child {
    margin-bottom: 0;
  }
  .chapter-body strong { font-weight: 700; }
  .chapter-body em { font-style: italic; }
  .chapter-body ul,
  .chapter-body ol {
    margin: 0 0 0.85rem;
    padding-left: 1.35rem;
  }
  .chapter-body li {
    margin: 0.2rem 0;
  }
  .chapter-body blockquote {
    margin: 0 0 0.85rem;
    padding: 0.35rem 0 0.35rem 1rem;
    border-left: 3px solid #d1d5db;
    color: #374151;
  }
  .chapter-body blockquote p {
    margin: 0;
  }
  .chapter-empty {
    font-style: italic;
    color: #6b7280;
  }
  @media print {
    body * {
      visibility: hidden;
    }
    .manuscript-shell,
    .manuscript-shell * {
      visibility: visible;
    }
    .manuscript-shell {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    body {
      background: #fff;
    }
    .manuscript-shell {
      max-width: none;
      padding: 0;
    }
    .manuscript-page {
      box-shadow: none;
      border-radius: 0;
      padding: 0;
    }
    .cover-page {
      margin: 0;
      min-height: 100vh;
      page-break-after: always;
      border-radius: 0;
    }
    .no-print {
      display: none !important;
    }
    .title-page {
      min-height: auto;
      page-break-after: always;
    }
    .toc-page {
      page-break-after: always;
    }
    .legal-page {
      page-break-before: always;
    }
    .chapter {
      page-break-before: always;
      min-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
    }
    .chapter:first-of-type {
      page-break-before: auto;
    }
    .chapter-content-wrap {
      flex: 1 1 auto;
    }
    .chapter-print-footer {
      margin-top: auto;
    }
    .chapter-print-page-number::before {
      content: "Page " counter(page);
    }
    .chapter-title,
    .chapter-body h1,
    .chapter-body h2,
    .chapter-body h3 {
      page-break-after: avoid;
      page-break-inside: avoid;
    }
  }
`;

export function getManuscriptPrintCss(printOptions: ManuscriptPrintOptions): string {
  const presetId = normalizeExportPresetId(printOptions.exportPreset);
  const pageTopMargin = printOptions.includeHeader ? "22mm" : "18mm";
  const pageBottomMargin = printOptions.includeFooter ? "22mm" : "18mm";

  const hideHeader = printOptions.includeHeader ? "" : ".chapter-print-header { display: none; }";
  const hideFooter = printOptions.includeFooter ? "" : ".chapter-print-footer { display: none; }";
  const hidePageNumbers =
    printOptions.includeFooter && printOptions.showPageNumbers
      ? ""
      : ".chapter-print-page-number { display: none; }";

  return `
${BASE_MANUSCRIPT_PRINT_CSS}
${getExportPresetCss(presetId)}
@page {
  margin: ${pageTopMargin} 16mm ${pageBottomMargin} 16mm;
}
${hideHeader}
${hideFooter}
${hidePageNumbers}
`;
}
