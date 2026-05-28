import { NextResponse } from "next/server";

import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import {
  deleteProjectNote,
  isProjectNotesSchemaMissing,
  updateProjectNote,
} from "@/lib/notes/project-notes-db";
import { PROJECT_NOTE_TAGS, type ProjectNoteTag } from "@/lib/notes/types";

type RouteContext = {
  params: Promise<{ projectId: string; noteId: string }>;
};

function parseTag(value: unknown): ProjectNoteTag | undefined {
  if (
    typeof value === "string" &&
    (PROJECT_NOTE_TAGS as readonly string[]).includes(value)
  ) {
    return value as ProjectNoteTag;
  }
  return undefined;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { projectId, noteId } = await context.params;

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

  const patch: Parameters<typeof updateProjectNote>[3] = {};

  const tag = parseTag(body.tag);
  if (tag) {
    patch.tag = tag;
  }
  if (typeof body.title === "string") {
    const trimmed = body.title.trim();
    if (trimmed) {
      patch.title = trimmed;
    }
  }
  if (typeof body.body === "string") {
    patch.body = body.body.trim();
  }
  if (body.chapterId === null) {
    patch.chapterId = null;
  } else if (typeof body.chapterId === "string") {
    patch.chapterId = body.chapterId.trim() ? body.chapterId.trim() : null;
  }
  if (body.sourceUrl === null) {
    patch.sourceUrl = null;
  } else if (typeof body.sourceUrl === "string") {
    patch.sourceUrl = body.sourceUrl.trim() || null;
  }
  if (body.sourceSummary === null) {
    patch.sourceSummary = null;
  } else if (typeof body.sourceSummary === "string") {
    patch.sourceSummary = body.sourceSummary.trim() || null;
  }
  if (typeof body.isPinned === "boolean") {
    patch.isPinned = body.isPinned;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No updates provided." }, { status: 400 });
  }

  try {
    const note = await updateProjectNote(supabase, projectId, noteId, patch);
    return NextResponse.json({ note });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update note.";
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

export async function DELETE(_request: Request, context: RouteContext) {
  const { projectId, noteId } = await context.params;

  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient(),
  );
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  try {
    await deleteProjectNote(supabase, projectId, noteId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete note.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
