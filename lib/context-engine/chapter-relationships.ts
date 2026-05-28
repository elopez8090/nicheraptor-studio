export type ChapterOutlineRow = {
  position: number;
  title: string;
  summary: string;
  status: string;
};

export type StructureAwareness = {
  currentPosition: number;
  totalChapters: number;
  alreadyExplainedTopics: string[];
  upcomingChapterTitles: string[];
  relationshipHint: string;
};

export function buildStructureAwareness(input: {
  chapters: ChapterOutlineRow[];
  currentPosition: number;
  priorExplainedTopics: string[];
}): StructureAwareness {
  const sorted = [...input.chapters].sort((a, b) => a.position - b.position);
  const current = sorted.find((c) => c.position === input.currentPosition);
  const upcoming = sorted
    .filter((c) => c.position > input.currentPosition)
    .map((c) => c.title);

  const priorGenerated = sorted.filter(
    (c) =>
      c.position < input.currentPosition && c.status === "generated",
  );

  let relationshipHint =
    "This chapter should advance the book arc without re-teaching earlier material.";
  if (input.currentPosition === 1) {
    relationshipHint =
      "Opening chapter: establish promise, audience fit, and core vocabulary.";
  } else if (upcoming.length === 0) {
    relationshipHint =
      "Final chapter: synthesize prior threads and close loops; avoid introducing major new topics.";
  } else if (current?.summary) {
    relationshipHint = `Fulfill this chapter's outline role while setting up: ${upcoming[0]}.`;
  }

  if (priorGenerated.length) {
    relationshipHint += ` ${priorGenerated.length} prior chapter(s) already generated — build on them.`;
  }

  return {
    currentPosition: input.currentPosition,
    totalChapters: sorted.length,
    alreadyExplainedTopics: input.priorExplainedTopics.slice(0, 24),
    upcomingChapterTitles: upcoming.slice(0, 5),
    relationshipHint,
  };
}

export function formatStructureAwarenessBlock(
  awareness: StructureAwareness,
): string {
  const explained =
    awareness.alreadyExplainedTopics.length > 0
      ? awareness.alreadyExplainedTopics.join("; ")
      : "(none recorded yet)";
  const upcoming =
    awareness.upcomingChapterTitles.length > 0
      ? awareness.upcomingChapterTitles.join(" → ")
      : "(none — likely final chapter)";

  return `Book structure awareness:
- You are writing chapter ${awareness.currentPosition} of ${awareness.totalChapters}.
- Already explained (do not re-introduce from scratch): ${explained}
- Still to cover in later chapters: ${upcoming}
- Guidance: ${awareness.relationshipHint}`;
}
