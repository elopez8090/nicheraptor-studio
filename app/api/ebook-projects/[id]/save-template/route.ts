import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id: projectId } = await context.params;

  if (!projectId?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  let body: { name?: string; description?: string };
  try {
    body = (await request.json()) as { name?: string; description?: string };
  } catch {
    body = {};
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("ebook_projects")
    .select("title, audience, goal")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("ebook_chapters")
    .select("title, summary, position")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  if (chaptersError || !chapters?.length) {
    return NextResponse.json(
      { error: "Project has no chapters to save as a template." },
      { status: 400 },
    );
  }

  const templateName =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : `${project.title} template`;

  const description =
    typeof body.description === "string" ? body.description.trim() : "";

  const chapterPayload = chapters.map((ch) => ({
    title: ch.title,
    summary: ch.summary,
  }));

  const { data: template, error: insertError } = await supabase
    .from("user_ebook_templates")
    .insert({
      user_id: user.id,
      name: templateName,
      description,
      default_title: project.title,
      default_audience: project.audience,
      default_goal: project.goal,
      chapters: chapterPayload,
    })
    .select("id")
    .single();

  if (insertError || !template) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to save template." },
      { status: 500 },
    );
  }

  return NextResponse.json({ templateId: template.id });
}
