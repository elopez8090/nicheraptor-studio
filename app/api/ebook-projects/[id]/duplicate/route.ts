import { NextResponse } from "next/server";

import { EBOOK_LENGTH_SETTINGS_DB_SELECT } from "@/lib/ebooks/ebook-length-settings";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id: sourceId } = await context.params;

  if (!sourceId?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: source, error: sourceError } = await supabase
    .from("ebook_projects")
    .select(
      `id, title, subtitle, author_name, niche, audience, goal, cover_storage_path, cover_image_url, workflow_status, notes, writing_style, human_score, humanization_options, export_settings, ${EBOOK_LENGTH_SETTINGS_DB_SELECT}`,
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("ebook_chapters")
    .select("position, title, summary, status, content")
    .eq("project_id", sourceId)
    .order("position", { ascending: true });

  if (chaptersError) {
    return NextResponse.json(
      { error: "Failed to load chapters.", details: chaptersError.message },
      { status: 500 },
    );
  }

  const copyTitle = `${source.title.replace(/\s*\(copy\)\s*$/i, "")} (Copy)`;

  const { data: project, error: insertError } = await supabase
    .from("ebook_projects")
    .insert({
      title: copyTitle,
      subtitle: source.subtitle ?? "",
      author_name: source.author_name ?? "",
      niche: source.niche ?? "",
      audience: source.audience,
      goal: source.goal,
      cover_storage_path: source.cover_storage_path,
      cover_image_url: source.cover_image_url,
      workflow_status: "drafting",
      user_id: user.id,
      notes: source.notes ? `Duplicated from "${source.title}".\n\n${source.notes}` : null,
      writing_style: source.writing_style,
      human_score: source.human_score,
      humanization_options: source.humanization_options,
      export_settings: source.export_settings,
      chapter_length: source.chapter_length,
      writing_depth: source.writing_depth,
      include_examples: source.include_examples,
      include_checklists: source.include_checklists,
      include_summaries: source.include_summaries,
      include_action_steps: source.include_action_steps,
    })
    .select("id")
    .single();

  if (insertError || !project) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to duplicate project." },
      { status: 500 },
    );
  }

  if (chapters?.length) {
    const chapterRows = chapters.map((ch) => ({
      project_id: project.id,
      position: ch.position,
      title: ch.title,
      summary: ch.summary,
      status: ch.status,
      content: ch.content,
    }));

    const { error: copyChaptersError } = await supabase
      .from("ebook_chapters")
      .insert(chapterRows);

    if (copyChaptersError) {
      await supabase.from("ebook_projects").delete().eq("id", project.id);
      return NextResponse.json(
        { error: copyChaptersError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ projectId: project.id });
}
