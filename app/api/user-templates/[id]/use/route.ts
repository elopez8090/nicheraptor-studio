import { NextResponse } from "next/server";

import { fetchUserEbookTemplateById } from "@/lib/ebooks/fetch-user-templates";
import { saveEbookOutlineWithClient } from "@/lib/ebooks/save-ebook-outline";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Template id is required." }, { status: 400 });
  }

  const template = await fetchUserEbookTemplateById(id);

  if (!template || template.chapters.length === 0) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  const supabase = await createClient();
  const result = await saveEbookOutlineWithClient(supabase, {
    title: template.defaultTitle,
    audience: template.defaultAudience,
    goal: template.defaultGoal,
    chapters: template.chapters,
  });

  if ("error" in result) {
    const status = result.error.includes("signed in") ? 401 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ projectId: result.projectId });
}
