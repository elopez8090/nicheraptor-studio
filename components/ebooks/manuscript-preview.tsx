import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";
import { CHAPTER_NOT_GENERATED_PLACEHOLDER } from "@/lib/ebooks/build-manuscript";

type ManuscriptPreviewProps = {
  manuscript: ManuscriptDocument;
};

export function ManuscriptPreview({ manuscript }: ManuscriptPreviewProps) {
  return (
    <article
      className="shadow-premium rounded-2xl border border-border/60 bg-card p-8 sm:p-10 md:p-12"
      aria-label="Manuscript preview"
    >
      <section className="border-b border-border/60 pb-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Title page
        </p>
        <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {manuscript.title}
        </h2>
      </section>

      <section className="border-b border-border/60 py-10">
        <h3 className="font-serif text-xl font-semibold text-foreground">
          Introduction
        </h3>
        <p className="mt-4 text-sm italic leading-relaxed text-muted-foreground">
          {manuscript.intro}
        </p>
      </section>

      <section className="border-b border-border/60 py-10">
        <h3 className="font-serif text-xl font-semibold text-foreground">
          Table of contents
        </h3>
        <ol className="mt-6 list-none space-y-2">
          {manuscript.toc.map((entry) => (
            <li
              key={entry.number}
              className="flex gap-3 text-sm leading-relaxed text-foreground"
            >
              <span className="w-8 shrink-0 tabular-nums text-muted-foreground">
                {entry.number}.
              </span>
              <span>{entry.title}</span>
            </li>
          ))}
        </ol>
      </section>

      {manuscript.chapters.map((chapter) => {
        const isPlaceholder = chapter.body === CHAPTER_NOT_GENERATED_PLACEHOLDER;

        return (
          <section
            key={chapter.number}
            className="border-b border-border/60 py-10 last:border-b-0"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Chapter {chapter.number}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-foreground">
              {chapter.title}
            </h3>
            {isPlaceholder ? (
              <p className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {chapter.body}
              </p>
            ) : (
              <pre className="mt-6 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {chapter.body}
              </pre>
            )}
          </section>
        );
      })}
    </article>
  );
}
