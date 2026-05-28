import type { ResearchEntry, ResearchSource } from "@/lib/research/types";

function dedupeSources(entries: ResearchEntry[]): ResearchSource[] {
  const seen = new Set<string>();
  const out: ResearchSource[] = [];
  for (const entry of entries) {
    for (const source of entry.sources) {
      const key = source.url.toLowerCase();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      out.push(source);
    }
  }
  return out;
}

export function appendSourcesSectionToChapterHtml(
  html: string,
  entries: ResearchEntry[],
): string {
  const sources = dedupeSources(entries);
  if (!sources.length) {
    return html;
  }

  const items = sources
    .map(
      (s) =>
        `<li><a href="${escapeAttr(s.url)}">${escapeText(s.title)}</a> — ${escapeText(s.url)}</li>`,
    )
    .join("");

  const section = `<h2>Sources</h2><ul>${items}</ul>`;
  const trimmed = html.trim();
  if (!trimmed) {
    return section;
  }
  return `${trimmed}\n${section}`;
}

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}
