import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ManuscriptPrintToolbar } from "@/components/ebooks/manuscript-print-toolbar";
import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";
import { chapterContentToEditorHtml } from "@/lib/ebooks/chapter-content-for-editor";
import { exportPresetClassName } from "@/lib/ebooks/export-presets";
import { getManuscriptPrintCss } from "@/lib/ebooks/manuscript-print-styles";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";
import { Button } from "@/components/ui/button";

type ManuscriptPrintViewProps = {
  projectId: string;
  manuscript: ManuscriptDocument;
  printOptions: ManuscriptPrintOptions;
};

export function ManuscriptPrintView({
  projectId,
  manuscript,
  printOptions,
}: ManuscriptPrintViewProps) {
  const authorLine = printOptions.authorName.trim();
  const headerLine = [
    printOptions.headerText.trim(),
    printOptions.showEbookTitleInHeader ? manuscript.title.trim() : "",
  ]
    .filter(Boolean)
    .join(" • ");
  const footerLine = [
    printOptions.footerText.trim(),
    printOptions.showAuthorNameInFooter ? authorLine : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return (
    <>
      <style
        dangerouslySetInnerHTML={{ __html: getManuscriptPrintCss(printOptions) }}
      />
      <div className="no-print border-b border-border bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ebooks/${projectId}/editor`}>
              <ArrowLeft className="size-4" aria-hidden />
              Back to editor
            </Link>
          </Button>
          <ManuscriptPrintToolbar />
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted-foreground">
          Layout and style preset are saved for this ebook in the editor export panel.
          Browser print page numbers can vary depending on print settings.
        </p>
      </div>

      <div className="manuscript-shell">
        <article
          className={`manuscript-page ${exportPresetClassName(printOptions.exportPreset)}`}
        >
          {printOptions.includeCover && manuscript.coverImageUrl ? (
            <section className="cover-page" aria-label="Ebook cover">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={manuscript.coverImageUrl}
                alt=""
                className="cover-image"
              />
              <div className="cover-overlay">
                <h1 className="cover-title">{manuscript.title}</h1>
                {authorLine ? (
                  <p className="title-author">{authorLine}</p>
                ) : null}
              </div>
            </section>
          ) : (
            <header className="title-page">
              <p className="title-kicker">Ebook</p>
              <h1 className="title-main">{manuscript.title}</h1>
              {authorLine ? <p className="title-author">{authorLine}</p> : null}
            </header>
          )}

          {printOptions.includeToc && manuscript.toc.length > 0 ? (
            <section className="toc-page" aria-label="Table of contents">
              <h2 className="toc-heading">Table of Contents</h2>
              <ol className="toc-list">
                {manuscript.toc.map((entry) => (
                  <li key={entry.number} className="toc-item">
                    <span className="toc-number">Chapter {entry.number}</span>
                    <span className="toc-title">{entry.title}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {manuscript.chapters.map((chapter) => {
            const bodyHtml = chapterContentToEditorHtml(chapter.body);
            return (
              <section key={chapter.number} className="chapter">
                {printOptions.includeHeader && headerLine ? (
                  <p className="chapter-print-header">{headerLine}</p>
                ) : null}
                <div className="chapter-content-wrap">
                  <p className="chapter-kicker">Chapter {chapter.number}</p>
                  <h2 className="chapter-title">{chapter.title}</h2>
                  {bodyHtml.trim() ? (
                    <div
                      className="chapter-body"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : (
                    <p className="chapter-empty">(No content)</p>
                  )}
                </div>
                {printOptions.includeFooter && (footerLine || printOptions.showPageNumbers) ? (
                  <div className="chapter-print-footer">
                    <span className="chapter-print-footer-text">{footerLine}</span>
                    {printOptions.showPageNumbers ? (
                      <span className="chapter-print-page-number" aria-hidden />
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}

          {printOptions.includeDisclaimer ? (
            <section className="legal-page" aria-label="Copyright and disclaimer">
              <h2 className="legal-heading">Copyright &amp; Disclaimer</h2>
              <p className="legal-author">
                © {new Date().getFullYear()}
                {authorLine ? ` ${authorLine}` : ""}. All rights reserved.
              </p>
              <p className="legal-title">
                <em>{manuscript.title}</em>
              </p>
              <p className="legal-body">
                This ebook is provided for informational purposes only. The author and
                publisher make no warranties regarding accuracy or completeness. You
                assume full responsibility for how you use this material.
              </p>
            </section>
          ) : null}
        </article>
      </div>

      <div className="no-print pb-10 pt-6 text-center">
        <ManuscriptPrintToolbar />
      </div>
    </>
  );
}
