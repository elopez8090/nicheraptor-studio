import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";
import { chapterContentToEditorHtml } from "@/lib/ebooks/chapter-content-for-editor";
import {
  exportPresetClassName,
  normalizeExportPresetId,
} from "@/lib/ebooks/export-presets";
import { getManuscriptPrintCss } from "@/lib/ebooks/manuscript-print-styles";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function chapterBodyHtml(rawBody: string): string {
  const html = chapterContentToEditorHtml(rawBody).trim();
  if (!html) {
    return `<p class="chapter-empty">(No content)</p>`;
  }
  return html;
}

const DEFAULT_PRINT_OPTIONS: ManuscriptPrintOptions = {
  authorName: "",
  includeCover: true,
  includeToc: true,
  includeDisclaimer: false,
  includeHeader: true,
  headerText: "",
  includeFooter: true,
  footerText: "",
  showPageNumbers: true,
  showEbookTitleInHeader: true,
  showAuthorNameInFooter: true,
  exportPreset: "clean-professional",
};

function buildTocSection(manuscript: ManuscriptDocument): string {
  if (manuscript.toc.length === 0) {
    return "";
  }
  const items = manuscript.toc
    .map(
      (entry) =>
        `<li class="toc-item"><span class="toc-number">Chapter ${entry.number}</span><span class="toc-title">${escapeHtml(entry.title)}</span></li>`,
    )
    .join("\n");
  return `
    <section class="toc-page" aria-label="Table of contents">
      <h2 class="toc-heading">Table of Contents</h2>
      <ol class="toc-list">${items}</ol>
    </section>
  `;
}

function buildDisclaimerSection(
  manuscript: ManuscriptDocument,
  authorName: string,
): string {
  const year = new Date().getFullYear();
  const authorLine = authorName.trim()
    ? `<p class="legal-author">© ${year} ${escapeHtml(authorName.trim())}. All rights reserved.</p>`
    : `<p class="legal-author">© ${year}. All rights reserved.</p>`;

  return `
    <section class="legal-page" aria-label="Copyright and disclaimer">
      <h2 class="legal-heading">Copyright &amp; Disclaimer</h2>
      ${authorLine}
      <p class="legal-title"><em>${escapeHtml(manuscript.title)}</em></p>
      <p class="legal-body">
        This ebook is provided for informational purposes only. The author and publisher
        make no warranties regarding accuracy or completeness. You assume full responsibility
        for how you use this material. Reproduction or distribution without permission may
        violate applicable law.
      </p>
    </section>
  `;
}

function buildCoverOrTitleSection(
  manuscript: ManuscriptDocument,
  options: ManuscriptPrintOptions,
): string {
  const title = escapeHtml(manuscript.title);
  const author = options.authorName.trim()
    ? `<p class="title-author">${escapeHtml(options.authorName.trim())}</p>`
    : "";

  if (options.includeCover && manuscript.coverImageUrl) {
    return `
      <section class="cover-page" aria-label="Ebook cover">
        <img src="${escapeHtml(manuscript.coverImageUrl)}" alt="" class="cover-image" />
        <div class="cover-overlay">
          <h1 class="cover-title">${title}</h1>
          ${author}
        </div>
      </section>
    `;
  }

  return `
    <header class="title-page">
      <p class="title-kicker">Ebook</p>
      <h1 class="title-main">${title}</h1>
      ${author}
    </header>
  `;
}

/**
 * Full HTML document for Puppeteer PDF export or print preview iframe.
 */
export function buildManuscriptPrintHtml(
  manuscript: ManuscriptDocument,
  printOptions?: Partial<ManuscriptPrintOptions>,
): string {
  const options: ManuscriptPrintOptions = {
    ...DEFAULT_PRINT_OPTIONS,
    ...printOptions,
  };
  const title = escapeHtml(manuscript.title);
  const authorName = options.authorName.trim();
  const headerLine = [
    options.headerText.trim(),
    options.showEbookTitleInHeader ? manuscript.title.trim() : "",
  ]
    .filter(Boolean)
    .join(" • ");
  const footerLine = [
    options.footerText.trim(),
    options.showAuthorNameInFooter ? authorName : "",
  ]
    .filter(Boolean)
    .join(" • ");

  const chapterSections = manuscript.chapters
    .map(
      (chapter) => `
      <section class="chapter">
        ${
          options.includeHeader && headerLine
            ? `<p class="chapter-print-header">${escapeHtml(headerLine)}</p>`
            : ""
        }
        <div class="chapter-content-wrap">
          <p class="chapter-kicker">Chapter ${chapter.number}</p>
          <h2 class="chapter-title">${escapeHtml(chapter.title)}</h2>
          <div class="chapter-body">
            ${chapterBodyHtml(chapter.body)}
          </div>
        </div>
        ${
          options.includeFooter && (footerLine || options.showPageNumbers)
            ? `<div class="chapter-print-footer"><span class="chapter-print-footer-text">${escapeHtml(footerLine)}</span>${
                options.showPageNumbers
                  ? '<span class="chapter-print-page-number" aria-hidden="true"></span>'
                  : ""
              }</div>`
            : ""
        }
      </section>
    `,
    )
    .join("\n");

  const coverSection = buildCoverOrTitleSection(manuscript, options);
  const tocSection = options.includeToc ? buildTocSection(manuscript) : "";
  const disclaimerSection = options.includeDisclaimer
    ? buildDisclaimerSection(manuscript, options.authorName)
    : "";

  const presetClass = exportPresetClassName(
    normalizeExportPresetId(options.exportPreset),
  );

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>${getManuscriptPrintCss(options)}</style>
  </head>
  <body>
    <div class="manuscript-shell">
      <article class="manuscript-page ${presetClass}">
        ${coverSection}
        ${tocSection}
        ${chapterSections}
        ${disclaimerSection}
      </article>
    </div>
  </body>
</html>`;
}
