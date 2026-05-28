import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type TemplateChapterInput = { title: string; summary: string };

function isValidChapters(value: unknown): value is TemplateChapterInput[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (ch) =>
        ch &&
        typeof ch === "object" &&
        typeof (ch as TemplateChapterInput).title === "string" &&
        (ch as TemplateChapterInput).title.trim() &&
        typeof (ch as TemplateChapterInput).summary === "string" &&
        (ch as TemplateChapterInput).summary.trim(),
    )
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Template id is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const input = body as {
    name?: string;
    description?: string;
    defaultTitle?: string;
    defaultAudience?: string;
    defaultGoal?: string;
    chapters?: unknown;
  };

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof input.name === "string" && input.name.trim()) {
    updates.name = input.name.trim();
  }
  if (typeof input.description === "string") {
    updates.description = input.description.trim();
  }
  if (typeof input.defaultTitle === "string" && input.defaultTitle.trim()) {
    updates.default_title = input.defaultTitle.trim();
  }
  if (typeof input.defaultAudience === "string") {
    updates.default_audience = input.defaultAudience.trim();
  }
  if (typeof input.defaultGoal === "string") {
    updates.default_goal = input.defaultGoal.trim();
  }
  if (input.chapters !== undefined) {
    if (!isValidChapters(input.chapters)) {
      return NextResponse.json({ error: "Invalid chapters." }, { status: 400 });
    }
    updates.chapters = input.chapters.map((ch) => ({
      title: ch.title.trim(),
      summary: ch.summary.trim(),
    }));
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ebook_templates")
    .update(updates)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update template.", details: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Template id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("user_ebook_templates").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete template.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
