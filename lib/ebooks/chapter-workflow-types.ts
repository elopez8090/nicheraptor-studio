export type ChapterGenerationStatus = "not_generated" | "generated";

export type EbookChapter = {
  id: string;
  number: number;
  title: string;
  summary: string;
  status: ChapterGenerationStatus;
  content: string | null;
};

export type EbookWithChapters = {
  id: string;
  title: string;
  audience: string;
  goal: string;
  coverStoragePath: string | null;
  coverImageUrl: string | null;
  chapters: EbookChapter[];
};
