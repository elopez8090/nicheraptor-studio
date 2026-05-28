export const OUTLINE_CHAPTER_COUNT_DEFAULT = 5;
export const OUTLINE_CHAPTER_COUNT_MIN = 3;
export const OUTLINE_CHAPTER_COUNT_MAX = 50;

export const OUTLINE_CHAPTER_COUNT_PRESETS = [
  {
    label: "Quick Lead Magnet",
    count: 3,
    description:
      "A tight opt-in magnet — fast to write and easy for readers to finish in one sitting.",
  },
  {
    label: "Short Guide",
    count: 5,
    description:
      "Covers the essentials without fluff — great for checklists, playbooks, and starter guides.",
  },
  {
    label: "Standard Ebook",
    count: 10,
    description:
      "Balanced depth for most niche ebooks, lead nurturers, and course companions.",
  },
  {
    label: "Authority Guide",
    count: 20,
    description:
      "Room for frameworks, examples, and nuance — positions you as the go-to expert.",
  },
  {
    label: "Full Book",
    count: 30,
    description:
      "Long-form scope for comprehensive systems, multi-phase programs, and flagship offers.",
  },
] as const;

export type OutlineChapterCountMode = "fixed" | "auto";

export type ResolvedOutlineChapterCount = {
  mode: OutlineChapterCountMode;
  /** Set when mode is `fixed`; used in prompts and validation. */
  count: number;
};

export function clampOutlineChapterCount(value: number): number {
  if (!Number.isFinite(value)) {
    return OUTLINE_CHAPTER_COUNT_DEFAULT;
  }
  return Math.min(
    OUTLINE_CHAPTER_COUNT_MAX,
    Math.max(OUTLINE_CHAPTER_COUNT_MIN, Math.round(value)),
  );
}

/** Human-readable size hint for the outline form. */
export function getEbookSizeEstimateLabel(chapterCount: number): string {
  const n = clampOutlineChapterCount(chapterCount);
  if (n >= 20) {
    return "Comprehensive book";
  }
  if (n >= 10) {
    return "Standard ebook";
  }
  if (n >= 5) {
    return "Short guide";
  }
  return "Compact guide";
}

/** Short helper copy under the chapter count control (manual mode). */
export function getChapterCountHelperDescription(chapterCount: number): string {
  const n = clampOutlineChapterCount(chapterCount);
  const preset = OUTLINE_CHAPTER_COUNT_PRESETS.find((p) => p.count === n);
  if (preset) {
    return preset.description;
  }
  if (n >= 25) {
    return "Extended book length — plan for a longer outline and writing timeline.";
  }
  if (n >= 15) {
    return "Deep guide — enough chapters to teach a full methodology step by step.";
  }
  if (n >= 8) {
    return "Mid-length ebook — mix overview chapters with tactical how-to sections.";
  }
  if (n >= 4) {
    return "Lean guide — keep each chapter focused on one outcome or action.";
  }
  return "Minimum length — best for a single problem/solution or a quick lead magnet.";
}

export function resolveOutlineChapterCountFromBody(body: unknown): ResolvedOutlineChapterCount {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const auto =
    record.chapterCountAuto === true ||
    record.autoChapterCount === true ||
    record.chapterCountMode === "auto";

  if (auto) {
    return { mode: "auto", count: OUTLINE_CHAPTER_COUNT_DEFAULT };
  }

  const raw =
    record.chapterCount ?? record.desiredChapterCount ?? record.chaptersCount;
  const parsed =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : OUTLINE_CHAPTER_COUNT_DEFAULT;

  return { mode: "fixed", count: clampOutlineChapterCount(parsed) };
}

export function buildOutlineChapterCountPromptLines(
  resolved: ResolvedOutlineChapterCount,
): string[] {
  if (resolved.mode === "auto") {
    return [
      `- Choose the best number of chapters for this topic (between ${OUTLINE_CHAPTER_COUNT_MIN} and ${OUTLINE_CHAPTER_COUNT_MAX}) based on topic depth, audience needs, and the stated goal.`,
      `- Generate exactly that many chapters — no more, no less.`,
    ];
  }

  const n = resolved.count;
  return [
    `- Generate exactly ${n} chapters — no more, no less.`,
    `- The "chapters" array in your JSON must contain exactly ${n} items.`,
  ];
}
