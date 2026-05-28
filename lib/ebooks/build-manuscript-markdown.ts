import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";

export function buildManuscriptMarkdown(manuscript: ManuscriptDocument): string {
  const lines: string[] = [];

  lines.push(`# ${manuscript.title}`, "", "---", "");

  lines.push("## Introduction", "", manuscript.intro, "", "---", "");

  lines.push("## Table of contents", "");
  for (const entry of manuscript.toc) {
    lines.push(`${entry.number}. ${entry.title}`);
  }
  lines.push("", "---", "");

  for (const chapter of manuscript.chapters) {
    lines.push(`## Chapter ${chapter.number}: ${chapter.title}`, "");
    lines.push(chapter.body);
    lines.push("", "---", "");
  }

  return lines.join("\n").replace(/\n---\n\n$/, "\n");
}
