import type { SupabaseClient } from "@supabase/supabase-js";

import type { ChapterContentSummary } from "@/lib/ai-memory/types";
import { isProjectAiMemorySchemaMissing } from "@/lib/ai-memory/schema";

type SummaryRow = {
  id: string;
  project_id: string;
  chapter_id: string;
  summary: string;
  key_concepts: string[] | null;
  terminology: unknown;
  explained_topics: string[] | null;
  content_hash: string | null;
  updated_at: string;
};

function parseTerminology(raw: unknown): Array<{ term: string; definition?: string }> {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: Array<{ term: string; definition?: string }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const row = item as { term?: string; definition?: string };
    if (!row.term?.trim()) {
      continue;
    }
    out.push({
      term: row.term.trim(),
      definition: row.definition?.trim() || undefined,
    });
  }
  return out;
}

function mapRow(row: SummaryRow): ChapterContentSummary {
  return {
    id: row.id,
    projectId: row.project_id,
    chapterId: row.chapter_id,
    summary: row.summary ?? "",
    keyConcepts: Array.isArray(row.key_concepts) ? row.key_concepts : [],
    terminology: parseTerminology(row.terminology),
    explainedTopics: Array.isArray(row.explained_topics)
      ? row.explained_topics
      : [],
    contentHash: row.content_hash,
    updatedAt: row.updated_at,
  };
}

export async function fetchChapterSummary(
  supabase: SupabaseClient,
  chapterId: string,
): Promise<ChapterContentSummary | null> {
  const { data, error } = await supabase
    .from("chapter_content_summaries")
    .select("*")
    .eq("chapter_id", chapterId)
    .maybeSingle();

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return null;
    }
    throw new Error(`Failed to load chapter summary: ${error.message}`);
  }

  return data ? mapRow(data as SummaryRow) : null;
}

export async function fetchPriorChapterSummaries(
  supabase: SupabaseClient,
  projectId: string,
  beforePosition: number,
): Promise<
  Array<
    ChapterContentSummary & {
      position: number;
      title: string;
    }
  >
> {
  const { data: chapters, error: chError } = await supabase
    .from("ebook_chapters")
    .select("id, position, title")
    .eq("project_id", projectId)
    .lt("position", beforePosition)
    .order("position", { ascending: true });

  if (chError) {
    if (isProjectAiMemorySchemaMissing(chError.message)) {
      return [];
    }
    throw new Error(`Failed to load chapters: ${chError.message}`);
  }

  if (!chapters?.length) {
    return [];
  }

  const ids = chapters.map((c) => c.id);
  const { data: summaries, error: sumError } = await supabase
    .from("chapter_content_summaries")
    .select("*")
    .eq("project_id", projectId)
    .in("chapter_id", ids);

  if (sumError) {
    if (isProjectAiMemorySchemaMissing(sumError.message)) {
      return [];
    }
    throw new Error(`Failed to load summaries: ${sumError.message}`);
  }

  const byChapter = new Map(
    (summaries ?? []).map((row) => [
      (row as SummaryRow).chapter_id,
      mapRow(row as SummaryRow),
    ]),
  );

  return chapters
    .map((ch) => {
      const summary = byChapter.get(ch.id);
      if (!summary?.summary?.trim()) {
        return null;
      }
      return {
        ...summary,
        position: ch.position,
        title: ch.title,
      };
    })
    .filter(
      (
        item,
      ): item is ChapterContentSummary & {
        position: number;
        title: string;
      } => item !== null,
    );
}

export async function upsertChapterSummary(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    chapterId: string;
    summary: string;
    keyConcepts: string[];
    terminology: Array<{ term: string; definition?: string }>;
    explainedTopics: string[];
    contentHash: string;
  },
): Promise<ChapterContentSummary | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("chapter_content_summaries")
    .upsert(
      {
        project_id: input.projectId,
        chapter_id: input.chapterId,
        summary: input.summary,
        key_concepts: input.keyConcepts,
        terminology: input.terminology,
        explained_topics: input.explainedTopics,
        content_hash: input.contentHash,
        updated_at: now,
      },
      { onConflict: "chapter_id" },
    )
    .select("*")
    .single();

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return null;
    }
    throw new Error(`Failed to save chapter summary: ${error.message}`);
  }

  return mapRow(data as SummaryRow);
}
