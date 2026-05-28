import type { SupabaseClient } from "@supabase/supabase-js";

import { isVoiceProfileId } from "@/lib/ai-memory/voice-profiles";
import type { VoiceProfileId } from "@/lib/ai-memory/types";
import type {
  ProjectAiMemoryRecord,
  ProjectMemoryKind,
  ProjectMemoryPayload,
} from "@/lib/ai-memory/types";
import { isProjectAiMemorySchemaMissing } from "@/lib/ai-memory/schema";

type MemoryRow = {
  id: string;
  user_id: string;
  project_kind: string;
  ebook_project_id: string | null;
  article_id: string | null;
  voice_profile: string | null;
  memory: Record<string, unknown> | null;
  embedding_status: string;
  embedding_meta: Record<string, unknown> | null;
  updated_at: string;
};

function parseMemoryPayload(raw: Record<string, unknown> | null): ProjectMemoryPayload {
  if (!raw || typeof raw !== "object") {
    return {};
  }
  return raw as ProjectMemoryPayload;
}

function mapRow(row: MemoryRow): ProjectAiMemoryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    projectKind: row.project_kind as ProjectMemoryKind,
    ebookProjectId: row.ebook_project_id,
    articleId: row.article_id,
    voiceProfile: isVoiceProfileId(row.voice_profile)
      ? row.voice_profile
      : null,
    memory: parseMemoryPayload(row.memory),
    embeddingStatus:
      row.embedding_status === "pending" || row.embedding_status === "ready"
        ? row.embedding_status
        : "none",
    embeddingMeta:
      row.embedding_meta && typeof row.embedding_meta === "object"
        ? row.embedding_meta
        : {},
    updatedAt: row.updated_at,
  };
}

export async function fetchEbookProjectMemory(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectAiMemoryRecord | null> {
  const { data, error } = await supabase
    .from("project_ai_memory")
    .select("*")
    .eq("project_kind", "ebook")
    .eq("ebook_project_id", projectId)
    .maybeSingle();

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return null;
    }
    throw new Error(`Failed to load project memory: ${error.message}`);
  }

  return data ? mapRow(data as MemoryRow) : null;
}

export async function fetchArticleProjectMemory(
  supabase: SupabaseClient,
  articleId: string,
): Promise<ProjectAiMemoryRecord | null> {
  const { data, error } = await supabase
    .from("project_ai_memory")
    .select("*")
    .eq("project_kind", "article")
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return null;
    }
    throw new Error(`Failed to load article memory: ${error.message}`);
  }

  return data ? mapRow(data as MemoryRow) : null;
}

export async function upsertEbookProjectMemory(
  supabase: SupabaseClient,
  input: {
    userId: string;
    projectId: string;
    voiceProfile?: VoiceProfileId | null;
    memoryPatch?: Partial<ProjectMemoryPayload>;
  },
): Promise<ProjectAiMemoryRecord | null> {
  const existing = await fetchEbookProjectMemory(supabase, input.projectId);
  const merged: ProjectMemoryPayload = {
    ...(existing?.memory ?? {}),
    ...(input.memoryPatch ?? {}),
  };
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from("project_ai_memory")
      .update({
        voice_profile: input.voiceProfile ?? existing.voiceProfile,
        memory: merged,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      if (isProjectAiMemorySchemaMissing(error.message)) {
        return null;
      }
      throw new Error(`Failed to update project memory: ${error.message}`);
    }
    return mapRow(data as MemoryRow);
  }

  const { data, error } = await supabase
    .from("project_ai_memory")
    .insert({
      user_id: input.userId,
      project_kind: "ebook",
      ebook_project_id: input.projectId,
      voice_profile: input.voiceProfile ?? null,
      memory: merged,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return null;
    }
    throw new Error(`Failed to create project memory: ${error.message}`);
  }

  return mapRow(data as MemoryRow);
}

export async function upsertArticleProjectMemory(
  supabase: SupabaseClient,
  input: {
    userId: string;
    articleId: string;
    voiceProfile?: VoiceProfileId | null;
    memoryPatch?: Partial<ProjectMemoryPayload>;
  },
): Promise<ProjectAiMemoryRecord | null> {
  const existing = await fetchArticleProjectMemory(supabase, input.articleId);
  const merged: ProjectMemoryPayload = {
    ...(existing?.memory ?? {}),
    ...(input.memoryPatch ?? {}),
  };
  const now = new Date().toISOString();

  if (existing) {
    const { data, error } = await supabase
      .from("project_ai_memory")
      .update({
        voice_profile: input.voiceProfile ?? existing.voiceProfile,
        memory: merged,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error) {
      if (isProjectAiMemorySchemaMissing(error.message)) {
        return null;
      }
      throw new Error(`Failed to update article memory: ${error.message}`);
    }
    return mapRow(data as MemoryRow);
  }

  const { data, error } = await supabase
    .from("project_ai_memory")
    .insert({
      user_id: input.userId,
      project_kind: "article",
      article_id: input.articleId,
      voice_profile: input.voiceProfile ?? null,
      memory: merged,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    if (isProjectAiMemorySchemaMissing(error.message)) {
      return null;
    }
    throw new Error(`Failed to create article memory: ${error.message}`);
  }

  return mapRow(data as MemoryRow);
}
