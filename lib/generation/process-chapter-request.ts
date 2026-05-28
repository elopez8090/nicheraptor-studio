import type { AiQualityTier } from "@/lib/ebooks/ai-quality-settings";

import type { GenerationJobChapterPlanItem } from "./types";

export function chapterGenerateUrl(
  projectId: string,
  chapterId: string,
  regenerate: boolean,
) {
  const action = regenerate ? "regenerate" : "generate";
  return `/api/ebooks/${encodeURIComponent(projectId)}/chapters/${encodeURIComponent(chapterId)}/${action}`;
}

export type ChapterGenerateResponse = {
  content?: string;
  error?: string;
  cancelled?: boolean;
  skipped?: boolean;
  usage?: { totalTokens?: number };
};

export async function requestChapterGeneration(options: {
  projectId: string;
  chapter: GenerationJobChapterPlanItem;
  quality: AiQualityTier;
  previousChapterId?: string;
  jobId?: string;
  libraryFrameworkId?: string | null;
}): Promise<
  | { ok: true; content: string; tokensUsed?: number }
  | { ok: false; cancelled?: boolean; skipped?: boolean; error: string }
> {
  const res = await fetch(
    chapterGenerateUrl(options.projectId, options.chapter.id, options.chapter.regenerate),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quality: options.quality,
        previousChapterId: options.previousChapterId,
        jobId: options.jobId,
        libraryFrameworkId: options.libraryFrameworkId ?? undefined,
      }),
    },
  );

  const data = (await res.json()) as ChapterGenerateResponse;

  if (data.cancelled || (res.status === 409 && data.cancelled)) {
    return { ok: false, cancelled: true, error: data.error ?? "Cancelled" };
  }

  if (res.status === 409 && data.error?.includes("already has content")) {
    return { ok: false, skipped: true, error: data.error };
  }

  if (!res.ok || !data.content) {
    return {
      ok: false,
      error: data.error ?? "Chapter generation failed.",
    };
  }

  return {
    ok: true,
    content: data.content,
    tokensUsed: data.usage?.totalTokens,
  };
}
