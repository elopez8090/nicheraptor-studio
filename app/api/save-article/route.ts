import { NextResponse } from "next/server";

import { verifyArticleAccess } from "@/lib/articles/verify-article-access";
import { createClient } from "@/lib/supabase/server";

type SaveArticleBody = {
  articleId?: string;
  content?: string;
  title?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveArticleBody;
    const { articleId, content, title } = body ?? {};

    if (!isNonEmptyString(articleId)) {
      return NextResponse.json(
        { error: "articleId is required." },
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
    const access = await verifyArticleAccess(supabase, articleId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Unauthorized." : "Article not found." },
        { status: access.status },
      );
    }

    const updates: Record<string, unknown> = {
      content,
      updated_at: new Date().toISOString(),
    };
    if (typeof title === "string" && title.trim()) {
      updates.title = title.trim();
    }

    const trimmed = content.trim();
    if (trimmed.length > 0) {
      updates.status = "generated";
    }

    const { data: updated, error: updateError } = await supabase
      .from("articles")
      .update(updates)
      .eq("id", articleId)
      .select("id, content, title, status")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to save article.",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    if (!updated) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    return NextResponse.json({
      content: updated.content,
      title: updated.title,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error in /api/save-article:", error);
    return NextResponse.json(
      { error: "Unexpected server error while saving article." },
      { status: 500 },
    );
  }
}
