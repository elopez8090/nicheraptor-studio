import { NextResponse } from "next/server";

import { fetchUserEbookTemplates } from "@/lib/ebooks/fetch-user-templates";
import { createClient } from "@/lib/supabase/server";

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

export async function GET() {
  const templates = await fetchUserEbookTemplates();
  return NextResponse.json({ templates });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

  if (!input.name?.trim() || !input.defaultTitle?.trim() || !isValidChapters(input.chapters)) {
    return NextResponse.json(
      { error: "Name, default title, and at least one chapter are required." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("user_ebook_templates")
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: typeof input.description === "string" ? input.description.trim() : "",
      default_title: input.defaultTitle.trim(),
      default_audience:
        typeof input.defaultAudience === "string" && input.defaultAudience.trim()
          ? input.defaultAudience.trim()
          : "General audience",
      default_goal:
        typeof input.defaultGoal === "string" && input.defaultGoal.trim()
          ? input.defaultGoal.trim()
          : "Help the reader achieve a clear outcome",
      chapters: input.chapters.map((ch) => ({
        title: ch.title.trim(),
        summary: ch.summary.trim(),
      })),
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create template." },
      { status: 500 },
    );
  }

  return NextResponse.json({ templateId: data.id });
}
