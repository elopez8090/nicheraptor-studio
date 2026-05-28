import type { ProjectNote } from "@/lib/notes/types";
import { PROJECT_NOTE_TAG_LABELS } from "@/lib/notes/types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

export function projectNoteToPlainText(note: ProjectNote): string {
  const tag = PROJECT_NOTE_TAG_LABELS[note.tag];
  const lines = [`[${tag}] ${note.title}`];
  if (note.body.trim()) {
    lines.push("", note.body.trim());
  }
  if (note.sourceUrl?.trim()) {
    lines.push("", `Source: ${note.sourceUrl.trim()}`);
  }
  if (note.sourceSummary?.trim()) {
    lines.push(note.sourceSummary.trim());
  }
  return lines.join("\n");
}

export function projectNoteToEditorHtml(note: ProjectNote): string {
  const tag = escapeHtml(PROJECT_NOTE_TAG_LABELS[note.tag]);
  const title = escapeHtml(note.title);
  const bodyParagraphs = note.body
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  const sourceBlock =
    note.sourceUrl?.trim()
      ? `<p><a href="${escapeAttr(note.sourceUrl.trim())}">${escapeHtml(note.sourceUrl.trim())}</a></p>`
      : "";

  const summaryBlock = note.sourceSummary?.trim()
    ? `<p><em>${escapeHtml(note.sourceSummary.trim())}</em></p>`
    : "";

  return `<h2>${title}</h2><p><strong>${tag}</strong></p>${bodyParagraphs}${summaryBlock}${sourceBlock}`;
}
