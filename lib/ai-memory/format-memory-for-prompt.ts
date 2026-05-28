import { voiceProfilePromptLine } from "@/lib/ai-memory/voice-profiles";
import type {
  PriorChapterMemorySlice,
  ProjectAiMemoryRecord,
  ProjectMemoryPayload,
} from "@/lib/ai-memory/types";

const MAX_PRIOR_CHAPTER_SUMMARIES = 8;
const MAX_SNIPPET_CHARS = 280;

export function formatProjectMemoryBlock(
  record: ProjectAiMemoryRecord | null,
  payloadOverride?: ProjectMemoryPayload,
): string | undefined {
  const memory = {
    ...(record?.memory ?? {}),
    ...(payloadOverride ?? {}),
  };
  const lines: string[] = [];

  const voiceLine = voiceProfilePromptLine(record?.voiceProfile ?? undefined);
  if (voiceLine) {
    lines.push(`Voice profile: ${voiceLine}`);
  }

  if (memory.targetAudience?.trim()) {
    lines.push(`Target audience (memory): ${memory.targetAudience.trim()}`);
  }
  if (memory.tone?.trim()) {
    lines.push(`Project tone / reader goal: ${memory.tone.trim()}`);
  }
  if (memory.writingStyle) {
    lines.push(`Writing style (memory): ${String(memory.writingStyle)}`);
  }
  if (memory.humanizationLevel !== undefined) {
    lines.push(`Humanization level: ${memory.humanizationLevel}`);
  }
  if (memory.recurringConcepts?.length) {
    lines.push(
      `Recurring concepts: ${memory.recurringConcepts.slice(0, 12).join("; ")}`,
    );
  }
  if (memory.terminology?.length) {
    const terms = memory.terminology
      .slice(0, 15)
      .map((t) =>
        t.definition ? `${t.term} — ${t.definition}` : t.term,
      )
      .join("; ");
    lines.push(`Terminology (use consistently): ${terms}`);
  }
  if (memory.importantResearchThemes?.length) {
    lines.push(
      `Research themes: ${memory.importantResearchThemes.slice(0, 5).join("; ")}`,
    );
  }
  if (memory.savedFrameworkNotes?.trim()) {
    lines.push(`Saved frameworks: ${memory.savedFrameworkNotes.trim()}`);
  }
  if (memory.favoritePromptStyles?.length) {
    lines.push(
      `Preferred prompt patterns: ${memory.favoritePromptStyles.slice(0, 5).join("; ")}`,
    );
  }

  if (!lines.length) {
    return undefined;
  }

  return `Project memory (persistent):\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

export function formatPriorChaptersSummaryBlock(
  slices: PriorChapterMemorySlice[],
): string | undefined {
  if (!slices.length) {
    return undefined;
  }

  const recent = slices.slice(-MAX_PRIOR_CHAPTER_SUMMARIES);
  const body = recent
    .map(
      (s) =>
        `Ch ${s.position} — ${s.title}: ${s.summary}${
          s.keyConcepts.length
            ? ` (concepts: ${s.keyConcepts.slice(0, 5).join(", ")})`
            : ""
        }`,
    )
    .join("\n");

  return `Prior chapters (compact memory — do not repeat full explanations):\n${body}`;
}

export function formatLibrarySnippetsBlock(
  snippets: Array<{ title: string; content: string }>,
): string | undefined {
  if (!snippets.length) {
    return undefined;
  }

  const lines = snippets.map((s) => {
    const text =
      s.content.length > MAX_SNIPPET_CHARS
        ? `${s.content.slice(0, MAX_SNIPPET_CHARS)}…`
        : s.content;
    return `- ${s.title}: ${text.replace(/\s+/g, " ").trim()}`;
  });

  return `Saved library snippets (reuse ideas, not verbatim copy):\n${lines.join("\n")}`;
}

export function formatProjectNotesBlock(
  notes: Array<{ title: string; body: string; tag: string }>,
): string | undefined {
  if (!notes.length) {
    return undefined;
  }

  const lines = notes.slice(0, 8).map((n) => {
    const body =
      n.body.length > 200 ? `${n.body.slice(0, 200)}…` : n.body;
    return `- [${n.tag}] ${n.title}: ${body.replace(/\s+/g, " ").trim()}`;
  });

  return `Project notes:\n${lines.join("\n")}`;
}
