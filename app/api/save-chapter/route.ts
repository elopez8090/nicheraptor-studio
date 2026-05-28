import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type SaveChapterBody = {
  projectId?: string;
  chapterId?: string;
  content?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveChapterBody;
    const { projectId, chapterId, content } = body ?? {};

    if (!isNonEmptyString(projectId) || !isNonEmptyString(chapterId)) {
      return NextResponse.json(
        {
          error: "Missing required fields: projectId and chapterId are required.",
        },
        { status: 400 },
      );
    }

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const trimmed = content.trim();

    const { data: updated, error: updateError } = await supabase
      .from("ebook_chapters")
      .update({
        content,
        status: trimmed.length > 0 ? "generated" : "not_generated",
      })
      .eq("id", chapterId)
      .eq("project_id", projectId)
      .select("id, content, status")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to save chapter to the database.",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Chapter not found for this project." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      content: updated.content,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error in /api/save-chapter:", error);
    return NextResponse.json(
      { error: "Unexpected server error while saving chapter." },
      { status: 500 },
    );
  }
}
