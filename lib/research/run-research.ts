import type { SupabaseClient } from "@supabase/supabase-js";

import { generateResearchSummary } from "@/lib/ai/research/generate-research-summary";
import { insertResearchEntry } from "@/lib/research/research-db";
import type { ResearchAction, ResearchRunResult } from "@/lib/research/types";

export type RunResearchInput = {
  apiKey: string;
  supabase: SupabaseClient;
  projectId: string;
  action: ResearchAction;
  ebookTitle: string;
  audience: string;
  goal: string;
  chapterId?: string | null;
  chapterTitle?: string;
  chapterSummary?: string;
  chapterNumber?: number;
};

/**
 * Research provider: today uses the chat model only.
 * Future: plug in web search APIs, RAG, or uploaded document retrieval here.
 */
export async function runResearch(
  input: RunResearchInput,
): Promise<ResearchRunResult> {
  const { content: parsed } = await generateResearchSummary(
    input.apiKey,
    {
      action: input.action,
      ebookTitle: input.ebookTitle,
      audience: input.audience,
      goal: input.goal,
      chapterTitle: input.chapterTitle,
      chapterSummary: input.chapterSummary,
      chapterNumber: input.chapterNumber,
    },
  );

  const researchType =
    input.action === "chapter" ? "chapter" : input.action;

  const entry = await insertResearchEntry(input.supabase, {
    projectId: input.projectId,
    chapterId: input.chapterId ?? null,
    researchType,
    title: parsed.title,
    summary: parsed.summary,
    content: parsed.content,
    sources: parsed.sources,
  });

  return { entry };
}
