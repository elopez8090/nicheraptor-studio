import type { ResearchEntry } from "@/lib/research/types";

const MAX_ENTRIES = 12;
const MAX_CONTENT_CHARS_PER_ENTRY = 1_800;

function trimContent(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_CONTENT_CHARS_PER_ENTRY) {
    return t;
  }
  return `${t.slice(0, MAX_CONTENT_CHARS_PER_ENTRY)}…`;
}

export function formatResearchForChapterPrompt(
  entries: ResearchEntry[],
): string | undefined {
  if (!entries.length) {
    return undefined;
  }

  const limited = entries.slice(-MAX_ENTRIES);
  const blocks = limited.map((entry, index) => {
    const scope = entry.chapterId ? "chapter-specific" : "project-wide";
    const sourceLines =
      entry.sources.length > 0
        ? entry.sources
            .map((s) => `  - ${s.title}: ${s.url}`)
            .join("\n")
        : "  (no URLs listed)";

    return `
[Research ${index + 1}] (${entry.researchType}, ${scope})
Title: ${entry.title}
Summary: ${entry.summary || "—"}
Notes:
${trimContent(entry.content)}
Suggested sources (verify before citing):
${sourceLines}
`.trim();
  });

  return `
Author-provided research (use for factual grounding; do not invent conflicting facts):
${blocks.join("\n\n")}

When using this research:
- Prefer these notes over guessing.
- Do not cite statistics or studies that are not supported by the research unless clearly framed as general advice.
- If research marks something as unverified, treat it cautiously in prose.
`.trim();
}
