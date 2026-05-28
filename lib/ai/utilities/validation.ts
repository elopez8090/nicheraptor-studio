export type EbookOutlineChapter = {
  title: string;
  summary: string;
};

export type EbookOutlinePayload = {
  title: string;
  audience: string;
  goal: string;
  chapters: EbookOutlineChapter[];
};

export function validateEbookOutlinePayload(
  value: unknown,
): value is EbookOutlinePayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as EbookOutlinePayload;
  if (
    typeof o.title !== "string" ||
    !o.title.trim() ||
    typeof o.audience !== "string" ||
    !o.audience.trim() ||
    typeof o.goal !== "string" ||
    !o.goal.trim() ||
    !Array.isArray(o.chapters) ||
    o.chapters.length === 0
  ) {
    return false;
  }
  return o.chapters.every(
    (ch) =>
      ch &&
      typeof ch.title === "string" &&
      ch.title.trim() &&
      typeof ch.summary === "string" &&
      ch.summary.trim(),
  );
}

export function validateTitleIdeasPayload(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  const titles = (value as { titles?: unknown }).titles;
  if (!Array.isArray(titles)) {
    return [];
  }
  return titles.filter(
    (t): t is string => typeof t === "string" && Boolean(t.trim()),
  );
}
