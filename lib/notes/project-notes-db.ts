import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProjectNote, ProjectNoteTag } from "@/lib/notes/types";
import { PROJECT_NOTE_TAGS } from "@/lib/notes/types";

type ProjectNoteRow = {
  id: string;
  project_id: string;
  chapter_id: string | null;
  tag: string;
  title: string;
  body: string;
  source_url: string | null;
  source_summary: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

function parseTag(value: string): ProjectNoteTag {
  if ((PROJECT_NOTE_TAGS as readonly string[]).includes(value)) {
    return value as ProjectNoteTag;
  }
  return "idea";
}

export function mapProjectNoteRow(row: ProjectNoteRow): ProjectNote {
  return {
    id: row.id,
    projectId: row.project_id,
    chapterId: row.chapter_id,
    tag: parseTag(row.tag),
    title: row.title,
    body: row.body,
    sourceUrl: row.source_url,
    sourceSummary: row.source_summary,
    isPinned: row.is_pinned,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isProjectNotesSchemaMissing(message: string): boolean {
  return message.includes("project_notes");
}

export async function fetchProjectNotes(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectNote[]> {
  const { data, error } = await supabase
    .from("project_notes")
    .select("*")
    .eq("project_id", projectId)
    .order("is_pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load notes: ${error.message}`);
  }

  return (data ?? []).map((row) => mapProjectNoteRow(row as ProjectNoteRow));
}

export async function insertProjectNote(
  supabase: SupabaseClient,
  input: {
    projectId: string;
    chapterId: string | null;
    tag: ProjectNoteTag;
    title: string;
    body: string;
    sourceUrl: string | null;
    sourceSummary: string | null;
    isPinned?: boolean;
  },
): Promise<ProjectNote> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("project_notes")
    .insert({
      project_id: input.projectId,
      chapter_id: input.chapterId,
      tag: input.tag,
      title: input.title,
      body: input.body,
      source_url: input.sourceUrl,
      source_summary: input.sourceSummary,
      is_pinned: input.isPinned ?? false,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to save note: ${error.message}`);
  }

  return mapProjectNoteRow(data as ProjectNoteRow);
}

export async function updateProjectNote(
  supabase: SupabaseClient,
  projectId: string,
  noteId: string,
  patch: {
    chapterId?: string | null;
    tag?: ProjectNoteTag;
    title?: string;
    body?: string;
    sourceUrl?: string | null;
    sourceSummary?: string | null;
    isPinned?: boolean;
  },
): Promise<ProjectNote> {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.chapterId !== undefined) {
    updates.chapter_id = patch.chapterId;
  }
  if (patch.tag !== undefined) {
    updates.tag = patch.tag;
  }
  if (patch.title !== undefined) {
    updates.title = patch.title;
  }
  if (patch.body !== undefined) {
    updates.body = patch.body;
  }
  if (patch.sourceUrl !== undefined) {
    updates.source_url = patch.sourceUrl;
  }
  if (patch.sourceSummary !== undefined) {
    updates.source_summary = patch.sourceSummary;
  }
  if (patch.isPinned !== undefined) {
    updates.is_pinned = patch.isPinned;
  }

  const { data, error } = await supabase
    .from("project_notes")
    .update(updates)
    .eq("id", noteId)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update note: ${error.message}`);
  }

  return mapProjectNoteRow(data as ProjectNoteRow);
}

export async function deleteProjectNote(
  supabase: SupabaseClient,
  projectId: string,
  noteId: string,
): Promise<void> {
  const { error } = await supabase
    .from("project_notes")
    .delete()
    .eq("id", noteId)
    .eq("project_id", projectId);

  if (error) {
    throw new Error(`Failed to delete note: ${error.message}`);
  }
}
