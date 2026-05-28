import { NextResponse } from "next/server";

import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import {
  fetchProjectNotes,
  insertProjectNote,
  isProjectNotesSchemaMissing,
} from "@/lib/notes/project-notes-db";
import { PROJECT_NOTE_TAGS, type ProjectNoteTag } from "@/lib/notes/types";

type RouteContext = { params: Promise<{ projectId: string }> };

function parseTag(value: unknown): ProjectNoteTag {
  if (
    typeof value === "string" &&
    (PROJECT_NOTE_TAGS as readonly string[]).includes(value)
  ) {
    return value as ProjectNoteTag;
  }
  return "idea";
}

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
    const notes = await fetchProjectNotes(supabase, projectId);
    return NextResponse.json({ notes });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load notes.";
    if (error instanceof Error && isProjectNotesSchemaMissing(message)) {
      return NextResponse.json(
        {
          error:
            "Notes are not available yet. Apply the latest Supabase migration.",
        },
        { status: 503 },
      );
    }
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
    tag?: unknown;
    title?: unknown;
    body?: unknown;
    chapterId?: unknown;
    sourceUrl?: unknown;
    sourceSummary?: unknown;
    isPinned?: unknown;
  };

  const tag = parseTag(body.tag);
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim()
      : tag === "source"
        ? "Untitled source"
        : "Untitled note";
  const noteBody = typeof body.body === "string" ? body.body.trim() : "";
  const sourceUrl =
    typeof body.sourceUrl === "string" && body.sourceUrl.trim()
      ? body.sourceUrl.trim()
      : null;
  const sourceSummary =
    typeof body.sourceSummary === "string" && body.sourceSummary.trim()
      ? body.sourceSummary.trim()
      : null;
  const chapterId =
    typeof body.chapterId === "string" && body.chapterId.trim()
      ? body.chapterId.trim()
      : null;
  const isPinned = body.isPinned === true;

  if (tag === "source") {
    if (!sourceUrl) {
      return NextResponse.json(
        { error: "Source URL is required for vault entries." },
        { status: 400 },
      );
    }
  } else if (!noteBody && !sourceSummary) {
    return NextResponse.json(
      { error: "Note content is required." },
      { status: 400 },
    );
  }

  try {
    const note = await insertProjectNote(supabase, {
      projectId,
      chapterId,
      tag,
      title,
      body: noteBody,
      sourceUrl,
      sourceSummary,
      isPinned,
    });
    return NextResponse.json({ note });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save note.";
    if (error instanceof Error && isProjectNotesSchemaMissing(message)) {
      return NextResponse.json(
        {
          error:
            "Notes are not available yet. Apply the latest Supabase migration.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
