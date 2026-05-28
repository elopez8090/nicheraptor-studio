import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isEbookWorkflowStatus } from "@/lib/ebooks/workflow-status";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type PatchBody = {
  title?: string;
  workflowStatus?: string;
  isStarred?: boolean;
  isArchived?: boolean;
  notes?: string | null;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.title === "string") {
    const trimmed = body.title.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    updates.title = trimmed;
  }

  if (body.workflowStatus !== undefined) {
    if (!isEbookWorkflowStatus(body.workflowStatus)) {
      return NextResponse.json({ error: "Invalid workflow status." }, { status: 400 });
    }
    updates.workflow_status = body.workflowStatus;
  }

  if (typeof body.isStarred === "boolean") {
    updates.is_starred = body.isStarred;
  }

  if (typeof body.isArchived === "boolean") {
    updates.is_archived = body.isArchived;
  }

  if (body.notes !== undefined) {
    updates.notes =
      body.notes === null
        ? null
        : typeof body.notes === "string"
          ? body.notes
          : undefined;
    if (updates.notes === undefined) {
      return NextResponse.json({ error: "Invalid notes." }, { status: 400 });
    }
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ebook_projects")
    .update(updates)
    .eq("id", id)
    .select("id, title, workflow_status, is_starred, is_archived, notes")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update project.", details: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    workflowStatus: data.workflow_status,
    isStarred: data.is_starred,
    isArchived: data.is_archived,
    notes: data.notes,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("ebook_projects").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete project.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
