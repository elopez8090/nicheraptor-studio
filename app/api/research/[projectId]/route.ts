import { NextResponse } from "next/server";

import {
  fetchProjectResearchSettings,
  fetchResearchEntriesForProject,
  insertResearchEntry,
} from "@/lib/research/research-db";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient(),
  );
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  try {
    const [entries, settings] = await Promise.all([
      fetchResearchEntriesForProject(supabase, projectId),
      fetchProjectResearchSettings(supabase, projectId),
    ]);
    return NextResponse.json({ entries, settings });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load research.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient(),
  );
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    title?: unknown;
    content?: unknown;
    summary?: unknown;
    chapterId?: unknown;
  };

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : "Saved note";
  const content =
    typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: "Note content is required." },
      { status: 400 },
    );
  }
  const summary =
    typeof body.summary === "string" ? body.summary.trim() : "";
  const chapterId =
    typeof body.chapterId === "string" && body.chapterId.trim()
      ? body.chapterId.trim()
      : null;

  try {
    const entry = await insertResearchEntry(supabase, {
      projectId,
      chapterId,
      researchType: "manual_note",
      title,
      summary,
      content,
      sources: [],
    });
    return NextResponse.json({ entry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
