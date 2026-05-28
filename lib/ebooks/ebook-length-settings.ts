export type ChapterLengthPreset = "short" | "standard" | "detailed";

export type WritingDepthPreset = "beginner" | "practical" | "expert";

export type EbookIncludeFlags = {
  examples: boolean;
  checklists: boolean;
  summaries: boolean;
  actionSteps: boolean;
};

export type EbookLengthSettings = {
  chapterLength: ChapterLengthPreset;
  writingDepth: WritingDepthPreset;
  include: EbookIncludeFlags;
};

export const DEFAULT_EBOOK_LENGTH_SETTINGS: EbookLengthSettings = {
  chapterLength: "standard",
  writingDepth: "practical",
  include: {
    examples: true,
    checklists: true,
    summaries: true,
    actionSteps: true,
  },
};

export const CHAPTER_LENGTH_OPTIONS: {
  value: ChapterLengthPreset;
  label: string;
  wordRange: string;
}[] = [
  { value: "short", label: "Short", wordRange: "700–1,000 words" },
  { value: "standard", label: "Standard", wordRange: "1,200–1,800 words" },
  { value: "detailed", label: "Detailed", wordRange: "2,000–3,000 words" },
];

export const WRITING_DEPTH_OPTIONS: {
  value: WritingDepthPreset;
  label: string;
  description: string;
}[] = [
  {
    value: "beginner",
    label: "Beginner-friendly",
    description: "Define terms, simple steps, minimal jargon.",
  },
  {
    value: "practical",
    label: "Practical / actionable",
    description: "How-to focus, templates, and clear next steps.",
  },
  {
    value: "expert",
    label: "Expert / advanced",
    description: "Deeper nuance, tradeoffs, and practitioner detail.",
  },
];

const CHAPTER_LENGTH_SET = new Set<ChapterLengthPreset>(
  CHAPTER_LENGTH_OPTIONS.map((o) => o.value),
);
const WRITING_DEPTH_SET = new Set<WritingDepthPreset>(
  WRITING_DEPTH_OPTIONS.map((o) => o.value),
);

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}

export function parseEbookLengthSettingsFromBody(
  body: unknown,
): EbookLengthSettings {
  const defaults = DEFAULT_EBOOK_LENGTH_SETTINGS;
  if (!body || typeof body !== "object") {
    return defaults;
  }
  const record = body as Record<string, unknown>;
  const includeRaw =
    record.include && typeof record.include === "object"
      ? (record.include as Record<string, unknown>)
      : record;

  const chapterLength = record.chapterLength ?? record.chapter_length;
  const writingDepth = record.writingDepth ?? record.writing_depth;

  return {
    chapterLength:
      typeof chapterLength === "string" &&
      CHAPTER_LENGTH_SET.has(chapterLength as ChapterLengthPreset)
        ? (chapterLength as ChapterLengthPreset)
        : defaults.chapterLength,
    writingDepth:
      typeof writingDepth === "string" &&
      WRITING_DEPTH_SET.has(writingDepth as WritingDepthPreset)
        ? (writingDepth as WritingDepthPreset)
        : defaults.writingDepth,
    include: {
      examples: parseBoolean(
        includeRaw.examples ?? includeRaw.include_examples,
        defaults.include.examples,
      ),
      checklists: parseBoolean(
        includeRaw.checklists ?? includeRaw.include_checklists,
        defaults.include.checklists,
      ),
      summaries: parseBoolean(
        includeRaw.summaries ?? includeRaw.include_summaries,
        defaults.include.summaries,
      ),
      actionSteps: parseBoolean(
        includeRaw.actionSteps ?? includeRaw.include_action_steps,
        defaults.include.actionSteps,
      ),
    },
  };
}

export type EbookLengthSettingsDbRow = {
  chapter_length: ChapterLengthPreset;
  writing_depth: WritingDepthPreset;
  include_examples: boolean;
  include_checklists: boolean;
  include_summaries: boolean;
  include_action_steps: boolean;
};

export function ebookLengthSettingsToDbRow(
  settings: EbookLengthSettings,
): EbookLengthSettingsDbRow {
  return {
    chapter_length: settings.chapterLength,
    writing_depth: settings.writingDepth,
    include_examples: settings.include.examples,
    include_checklists: settings.include.checklists,
    include_summaries: settings.include.summaries,
    include_action_steps: settings.include.actionSteps,
  };
}

export function ebookLengthSettingsFromDbRow(
  row: Partial<EbookLengthSettingsDbRow> | null | undefined,
): EbookLengthSettings {
  const defaults = DEFAULT_EBOOK_LENGTH_SETTINGS;
  if (!row) {
    return defaults;
  }
  return {
    chapterLength:
      row.chapter_length && CHAPTER_LENGTH_SET.has(row.chapter_length)
        ? row.chapter_length
        : defaults.chapterLength,
    writingDepth:
      row.writing_depth && WRITING_DEPTH_SET.has(row.writing_depth)
        ? row.writing_depth
        : defaults.writingDepth,
    include: {
      examples: row.include_examples ?? defaults.include.examples,
      checklists: row.include_checklists ?? defaults.include.checklists,
      summaries: row.include_summaries ?? defaults.include.summaries,
      actionSteps: row.include_action_steps ?? defaults.include.actionSteps,
    },
  };
}

export function getChapterWordRange(settings: EbookLengthSettings): {
  min: number;
  max: number;
  label: string;
} {
  const option = CHAPTER_LENGTH_OPTIONS.find(
    (o) => o.value === settings.chapterLength,
  );
  switch (settings.chapterLength) {
    case "short":
      return { min: 700, max: 1_000, label: option?.wordRange ?? "700–1,000 words" };
    case "detailed":
      return {
        min: 2_000,
        max: 3_000,
        label: option?.wordRange ?? "2,000–3,000 words",
      };
    default:
      return {
        min: 1_200,
        max: 1_800,
        label: option?.wordRange ?? "1,200–1,800 words",
      };
  }
}

function writingDepthPromptLine(depth: WritingDepthPreset): string {
  switch (depth) {
    case "beginner":
      return "Writing depth: beginner-friendly — explain concepts plainly, avoid jargon unless defined, and assume the reader is new to the topic.";
    case "expert":
      return "Writing depth: expert/advanced — assume baseline knowledge, go deeper on tradeoffs, edge cases, and professional judgment.";
    default:
      return "Writing depth: practical and actionable — prioritize clear steps, decisions, and outcomes the reader can apply immediately.";
  }
}

function includePromptLines(include: EbookIncludeFlags): string[] {
  const lines: string[] = [];
  if (include.examples) {
    lines.push("- Include concrete examples where they clarify the point.");
  } else {
    lines.push("- Do not add dedicated example sections or extended anecdotes.");
  }
  if (include.checklists) {
    lines.push("- Use checklists or numbered action lists when they help execution.");
  } else {
    lines.push("- Do not use checklist-style sections.");
  }
  if (include.summaries) {
    lines.push("- End sections or the chapter with brief recap bullets or summary takeaways where natural.");
  } else {
    lines.push("- Do not add recap/summary sections beyond a short closing.");
  }
  if (include.actionSteps) {
    lines.push("- Include clear action steps the reader can take next.");
  } else {
    lines.push("- Keep guidance conceptual; avoid step-by-step homework-style action lists.");
  }
  return lines;
}

export function buildOutlineLengthPromptLines(
  settings: EbookLengthSettings,
): string[] {
  const range = getChapterWordRange(settings);
  return [
    `- Target chapter length when written: ${range.label} per chapter (${range.min}–${range.max} words).`,
    `- ${writingDepthPromptLine(settings.writingDepth)}`,
    "- Plan chapter summaries so each chapter can support that depth and length (enough subtopics, not thin placeholders).",
    ...includePromptLines(settings.include).map((line) =>
      line.replace(/^- /, "- Outline should assume: "),
    ),
  ];
}

export function buildChapterLengthPromptLines(
  settings: EbookLengthSettings,
): string[] {
  const range = getChapterWordRange(settings);
  return [
    `- Target length: ${range.min}–${range.max} words (${range.label}).`,
    `- ${writingDepthPromptLine(settings.writingDepth)}`,
    ...includePromptLines(settings.include),
  ];
}

/** Scale model output cap for longer chapter presets (still capped for cost). */
export function resolveMaxOutputTokensForChapterLength(
  chapterLength: ChapterLengthPreset,
  baseMaxOutputTokens: number,
): number {
  switch (chapterLength) {
    case "short":
      return Math.min(baseMaxOutputTokens, 2_400);
    case "detailed":
      return Math.min(Math.round(baseMaxOutputTokens * 1.35), 6_000);
    default:
      return baseMaxOutputTokens;
  }
}

export const EBOOK_LENGTH_SETTINGS_DB_SELECT =
  "chapter_length, writing_depth, include_examples, include_checklists, include_summaries, include_action_steps";
