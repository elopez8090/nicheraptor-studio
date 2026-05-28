import type { EbookWithChapters } from "@/lib/ebooks/chapter-workflow-types";
import { createClient } from "@/lib/supabase/server";

type ProjectRow = {
  id: string;
  title: string;
  audience: string;
  goal: string;
  cover_storage_path?: string | null;
  cover_image_url?: string | null;
};

async function fetchProjectRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
): Promise<ProjectRow | null> {
  const withCover = await supabase
    .from("ebook_projects")
    .select("id, title, audience, goal, cover_storage_path, cover_image_url")
    .eq("id", projectId)
    .maybeSingle();

  if (!withCover.error && withCover.data) {
    return withCover.data as ProjectRow;
  }

  const base = await supabase
    .from("ebook_projects")
    .select("id, title, audience, goal")
    .eq("id", projectId)
    .maybeSingle();

  if (base.error || !base.data) {
    return null;
  }

  return base.data as ProjectRow;
}

export async function fetchEbookWithChapters(
  projectId: string,
): Promise<EbookWithChapters | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const project = await fetchProjectRow(supabase, projectId);

  if (!project) {
    return null;
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("ebook_chapters")
    .select("id, position, title, summary, status, content")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (chaptersError || !chapters?.length) {
    return null;
  }

  return {
    id: project.id,
    title: project.title,
    audience: project.audience,
    goal: project.goal,
    coverStoragePath: project.cover_storage_path ?? null,
    coverImageUrl: project.cover_image_url ?? null,
    chapters: chapters.map((row) => ({
      id: row.id,
      number: row.position,
      title: row.title,
      summary: row.summary,
      status:
        row.status === "generated" ? "generated" : ("not_generated" as const),
      content: row.content,
    })),
  };
}
