import { NextResponse } from "next/server";

import { runResearch } from "@/lib/research/run-research";
import { RESEARCH_ACTIONS, type ResearchAction } from "@/lib/research/types";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";

type RouteContext = { params: Promise<{ projectId: string }> };

function isResearchAction(value: unknown): value is ResearchAction {
  return (
    typeof value === "string" &&
    (RESEARCH_ACTIONS as readonly string[]).includes(value)
  );
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing OPENAI_API_KEY." },
      { status: 500 },
    );
  }

  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient(),
  );
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: unknown;
    chapterId?: unknown;
  };

  if (!isResearchAction(body.action)) {
    return NextResponse.json(
      { error: "Invalid research action." },
      { status: 400 },
    );
  }

  const chapterId =
    typeof body.chapterId === "string" && body.chapterId.trim()
      ? body.chapterId.trim()
      : null;

  if (body.action === "chapter" && !chapterId) {
    return NextResponse.json(
      { error: "Select a chapter before running this research action." },
      { status: 400 },
    );
  }

  const { data: project, error: projectError } = await supabase
    .from("ebook_projects")
    .select("title, audience, goal")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let chapterTitle: string | undefined;
  let chapterSummary: string | undefined;
  let chapterNumber: number | undefined;

  if (chapterId) {
    const { data: chapter } = await supabase
      .from("ebook_chapters")
      .select("title, summary, position")
      .eq("id", chapterId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
    }
    chapterTitle = chapter.title;
    chapterSummary = chapter.summary;
    chapterNumber = chapter.position;
  }

  try {
    const result = await runResearch({
      apiKey,
      supabase,
      projectId,
      action: body.action,
      ebookTitle: project.title,
      audience: project.audience,
      goal: project.goal,
      chapterId,
      chapterTitle,
      chapterSummary,
      chapterNumber,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Research request failed.";
    console.error("Research error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
