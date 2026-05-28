import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ResearchEntry,
  ResearchEntryType,
  ResearchProjectSettings,
  ResearchSource,
} from "@/lib/research/types";

type ResearchRow = {
  id: string;
  project_id: string;
  chapter_id: string | null;
  research_type: string;
  title: string;
  summary: string;
  content: string;
  sources: unknown;
  created_at: string;
  updated_at: string;
};

function mapSources(raw: unknown): ResearchSource[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const url = "url" in item ? String(item.url).trim() : "";
      const title = "title" in item ? String(item.title).trim() : "";
      if (!url.startsWith("http")) {
        return null;
      }
      return { url, title: title || url };
    })
    .filter((s): s is ResearchSource => s !== null);
}

export function mapResearchRow(row: ResearchRow): ResearchEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    chapterId: row.chapter_id,
    researchType: row.research_type as ResearchEntryType,
    title: row.title,
    summary: row.summary,
    content: row.content,
    sources: mapSources(row.sources),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchResearchEntriesForProject(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ResearchEntry[]> {
  const { data, error } = await supabase
    .from("ebook_research_entries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load research: ${error.message}`);
  }

  return (data ?? []).map((row) => mapResearchRow(row as ResearchRow));
}

export async function fetchResearchContextForChapter(
  supabase: SupabaseClient,
  projectId: string,
  chapterId: string,
): Promise<ResearchEntry[]> {
  const { data, error } = await supabase
    .from("ebook_research_entries")
    .select("*")
    .eq("project_id", projectId)
    .or(`chapter_id.is.null,chapter_id.eq.${chapterId}`)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.message.includes("ebook_research_entries")) {
      return [];
    }
    throw new Error(`Failed to load research context: ${error.message}`);
  }

  return (data ?? []).map((row) => mapResearchRow(row as ResearchRow));
}

export async function fetchProjectResearchSettings(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ResearchProjectSettings> {
  const { data, error } = await supabase
    .from("ebook_projects")
    .select("include_source_references")
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    if (
      error.message.includes("include_source_references") ||
      error.message.includes("column")
    ) {
      return { includeSourceReferences: false };
    }
    throw new Error(`Failed to load project settings: ${error.message}`);
  }

  return {
    includeSourceReferences: Boolean(data?.include_source_references),
  };
}

export async function insertResearchEntry(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    chapterId: string | null;
    researchType: ResearchEntryType;
    title: string;
    summary: string;
    content: string;
    sources: ResearchSource[];
  },
): Promise<ResearchEntry> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("ebook_research_entries")
    .insert({
      project_id: input.projectId,
      chapter_id: input.chapterId,
      research_type: input.researchType,
      title: input.title,
      summary: input.summary,
      content: input.content,
      sources: input.sources,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save research: ${error.message}`);
  }

  return mapResearchRow(data as ResearchRow);
}

export async function updateProjectIncludeSourceReferences(
  supabase: SupabaseClient,
  projectId: string,
  includeSourceReferences: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("ebook_projects")
    .update({ include_source_references: includeSourceReferences })
    .eq("id", projectId);

  if (error) {
    if (
      error.message.includes("include_source_references") ||
      error.message.includes("column")
    ) {
      throw new Error(
        "Research settings are not available yet. Run supabase/ebook_research.sql in your database.",
      );
    }
    throw new Error(`Failed to update settings: ${error.message}`);
  }
}
