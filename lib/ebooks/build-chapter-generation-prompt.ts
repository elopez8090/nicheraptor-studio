import {
  buildChapterLengthPromptLines,
  DEFAULT_EBOOK_LENGTH_SETTINGS,
  type EbookLengthSettings,
} from "@/lib/ebooks/ebook-length-settings";
import {
  buildHumanizationLayers,
  buildLayeredPromptText,
} from "@/lib/ai/prompts/humanization-layers";
import {
  resolveHumanizationConfig,
  type HumanizationOptions,
  type HumanScore,
} from "@/lib/ai/humanization/config";
import { normalizeWritingStyle, type WritingStyle } from "@/lib/ai/styles/writing-styles";

export type ChapterGenerationContext = {
  ebookTitle: string;
  audience: string;
  goal: string;
  chapterNumber: number;
  totalChapters: number;
  chapterTitle: string;
  chapterSummary: string;
  previousChapterTitle?: string;
  previousChapterClosingSnippet?: string;
  researchNotesBlock?: string;
  /** Saved writing framework from the content library */
  writingFrameworkBlock?: string;
  includeSourceReferences?: boolean;
  lengthSettings?: EbookLengthSettings;
  writingStyle?: WritingStyle;
  humanScore?: HumanScore;
  humanizationOptions?: Partial<HumanizationOptions> | null;
  /** Phase 29 — compact memory / context blocks */
  projectMemoryBlock?: string;
  priorChaptersSummaryBlock?: string;
  projectNotesBlock?: string;
  librarySnippetsBlock?: string;
  structureAwarenessBlock?: string;
  consistencyGuidanceBlock?: string;
  continuityInstructionsBlock?: string;
};

export function buildChapterGenerationPrompt(
  ctx: ChapterGenerationContext,
): string {
  const lengthSettings = ctx.lengthSettings ?? DEFAULT_EBOOK_LENGTH_SETTINGS;
  const lengthLines = buildChapterLengthPromptLines(lengthSettings);
  const transitionBlock =
    ctx.previousChapterTitle && ctx.previousChapterClosingSnippet
      ? `
Previous chapter (for continuity only — do not repeat its content):
- Title: ${ctx.previousChapterTitle}
- Closing lines: ${ctx.previousChapterClosingSnippet}

Open this chapter with a natural bridge from the previous chapter, then move into new material.
`
      : ctx.chapterNumber > 1
        ? `
This is not the first chapter. Begin with a brief transition that connects to what came before, without repeating prior chapters.
`
        : `
This is the first chapter. Open with a compelling hook appropriate for the audience.
`;

  const memoryBlocks = [
    ctx.projectMemoryBlock,
    ctx.priorChaptersSummaryBlock,
    ctx.structureAwarenessBlock,
    ctx.continuityInstructionsBlock,
    ctx.consistencyGuidanceBlock,
    ctx.projectNotesBlock,
    ctx.librarySnippetsBlock,
  ]
    .filter((block) => block?.trim())
    .join("\n\n");

  const chapterContextPrompt = `
Write one complete chapter for an ebook.

Ebook context:
- Title: ${ctx.ebookTitle}
- Audience: ${ctx.audience}
- Reader goal: ${ctx.goal}

This chapter (${ctx.chapterNumber} of ${ctx.totalChapters}):
- Title: ${ctx.chapterTitle}
- Outline summary: ${ctx.chapterSummary}
${
  memoryBlocks
    ? `
${memoryBlocks}
`
    : ""
}
${transitionBlock}
${
  ctx.researchNotesBlock
    ? `
${ctx.researchNotesBlock}
`
    : ""
}
${
  ctx.writingFrameworkBlock?.trim()
    ? `
Writing framework to follow (structure and angle — adapt to this chapter):
${ctx.writingFrameworkBlock.trim()}
`
    : ""
}

Writing requirements:
- Output TipTap-compatible HTML only: one <h1> for the chapter title, <h2> for sections, <p> for body text, lists with <ul>/<ol> and <li> where helpful.
- Sound human: varied sentence length, concrete specifics, no filler openers ("In today's world", "It's important to note", "delve", "leverage", "robust", "tapestry").
- Avoid repeating the same transition phrases across sections; use fresh wording.
- Reference relevant earlier chapter concepts naturally when helpful, without recap dumps.
- Include a clear introduction, well-structured body with smooth transitions between sections.
- Do not invent statistics, studies, book titles, or quotes unless the outline or research notes support them.
- End with a short conclusion that reinforces takeaways and sets up what comes next (except on the final chapter, where you may close the book).
${
  ctx.includeSourceReferences
    ? `- After the conclusion, include a section with <h2>Sources</h2> and a <ul> of reference links drawn only from the research notes (title + URL per <li>). Do not add sources that were not listed in research.`
    : "- Do not add a Sources section unless research notes include URLs you were told to cite."
}
${lengthLines.map((line) => line).join("\n")}
- Do not mention AI, prompts, or the writing process.

Respond with the chapter draft only (HTML, no markdown).
`;

  const layers = buildHumanizationLayers({
    writingStyle: normalizeWritingStyle(ctx.writingStyle),
    humanization: resolveHumanizationConfig({
      score: ctx.humanScore,
      options: ctx.humanizationOptions,
    }),
    seedHint: `${ctx.ebookTitle}:${ctx.chapterNumber}:${ctx.chapterTitle}`,
    chapterContextPrompt,
  });

  return buildLayeredPromptText(layers);
}

export function extractClosingSnippet(
  content: string | null | undefined,
  maxChars = 420,
): string | undefined {
  if (!content?.trim()) {
    return undefined;
  }
  const plain = content
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) {
    return undefined;
  }
  if (plain.length <= maxChars) {
    return plain;
  }
  return `…${plain.slice(-maxChars)}`;
}
