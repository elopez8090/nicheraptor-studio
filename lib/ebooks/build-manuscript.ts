import type { EbookWithChapters } from "@/lib/ebooks/chapter-workflow-types";

export const MANUSCRIPT_INTRO_PLACEHOLDER =
  "Introduction — This section will be written in a future version of the editor.";

export const CHAPTER_NOT_GENERATED_PLACEHOLDER =
  "[Chapter not generated yet]";

export type ManuscriptTocEntry = {
  number: number;
  title: string;
};

export type ManuscriptChapterBlock = {
  number: number;
  title: string;
  body: string;
};

export type ManuscriptDocument = {
  title: string;
  audience: string;
  goal: string;
  /** Optional fully-resolved cover image URL for print/PDF exports. */
  coverImageUrl?: string | null;
  intro: string;
  toc: ManuscriptTocEntry[];
  chapters: ManuscriptChapterBlock[];
};

export type BuildManuscriptOptions = {
  /** When true, TOC and chapter bodies include only generated chapters. */
  generatedChaptersOnly?: boolean;
};

function chapterHasGeneratedContent(chapter: EbookWithChapters["chapters"][number]) {
  const content = chapter.content?.trim();
  return chapter.status === "generated" && Boolean(content);
}

export function buildManuscript(
  ebook: EbookWithChapters,
  options?: BuildManuscriptOptions,
): ManuscriptDocument {
  const sourceChapters = options?.generatedChaptersOnly
    ? ebook.chapters.filter(chapterHasGeneratedContent)
    : ebook.chapters;

  const toc: ManuscriptTocEntry[] = sourceChapters.map((chapter) => ({
    number: chapter.number,
    title: chapter.title,
  }));

  const chapters: ManuscriptChapterBlock[] = sourceChapters.map((chapter) => {
    const content = chapter.content?.trim();
    const hasContent = chapterHasGeneratedContent(chapter);

    return {
      number: chapter.number,
      title: chapter.title,
      body: hasContent ? content! : CHAPTER_NOT_GENERATED_PLACEHOLDER,
    };
  });

  return {
    title: ebook.title,
    audience: ebook.audience,
    goal: ebook.goal,
    coverImageUrl: ebook.coverImageUrl ?? null,
    intro: MANUSCRIPT_INTRO_PLACEHOLDER,
    toc,
    chapters,
  };
}
