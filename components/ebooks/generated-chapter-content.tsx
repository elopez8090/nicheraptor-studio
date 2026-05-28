import { FileText } from "lucide-react";

const PREVIEW_MAX_CHARS = 600;

type GeneratedChapterContentProps = {
  chapterTitle: string;
  content: string;
};

function previewText(markdown: string): string {
  const trimmed = markdown.trim();
  if (trimmed.length <= PREVIEW_MAX_CHARS) {
    return trimmed;
  }
  return `${trimmed.slice(0, PREVIEW_MAX_CHARS).trimEnd()}…`;
}

export function GeneratedChapterContent({
  chapterTitle,
  content,
}: GeneratedChapterContentProps) {
  const preview = previewText(content);

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <FileText className="size-3.5" aria-hidden />
        Generated chapter preview
      </div>
      <p className="text-sm font-medium text-foreground">{chapterTitle}</p>
      <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {preview}
      </pre>
      {content.length > PREVIEW_MAX_CHARS ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing the first {PREVIEW_MAX_CHARS} characters. Full chapter is saved.
        </p>
      ) : null}
    </div>
  );
}
