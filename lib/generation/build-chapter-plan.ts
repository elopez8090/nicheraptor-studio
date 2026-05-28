import type { ChapterGenerationStatus } from "@/lib/ebooks/chapter-workflow-types";

import type { GenerationJobChapterPlanItem } from "./types";

export type ChapterForPlan = {
  id: string;
  number: number;
  title: string;
  status: ChapterGenerationStatus;
};

export function buildGenerationChapterPlan(options: {
  chapters: ChapterForPlan[];
  chapterIdsFilter?: string[];
  regenerateExistingChapters?: boolean;
}): GenerationJobChapterPlanItem[] {
  const { chapters, chapterIdsFilter, regenerateExistingChapters } = options;

  let target = chapterIdsFilter
    ? chapters.filter((c) => chapterIdsFilter.includes(c.id))
    : regenerateExistingChapters
      ? chapters
      : chapters.filter((c) => c.status !== "generated");

  target = target.slice().sort((a, b) => a.number - b.number);

  return target.map((chapter) => ({
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    regenerate:
      Boolean(regenerateExistingChapters) ||
      chapter.status === "generated" ||
      Boolean(chapterIdsFilter),
  }));
}
