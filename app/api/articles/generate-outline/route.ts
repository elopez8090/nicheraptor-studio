import { NextResponse } from "next/server";

import { generateArticleOutline } from "@/lib/ai/generators/article";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { buildArticleGenerationMemory } from "@/lib/context-engine/build-article-context";
import { loadArticleContext } from "@/lib/articles/load-article-for-ai";
import { verifyArticleAccess } from "@/lib/articles/verify-article-access";
import { createClient } from "@/lib/supabase/server";

type Body = { articleId?: string };

export async function POST(request: Request) {
  try {
    let apiKey: string;
    try {
      apiKey = requireOpenAiApiKey();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error: missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as Body;
    const articleId =
      typeof body.articleId === "string" ? body.articleId.trim() : "";
    if (!articleId) {
      return NextResponse.json({ error: "articleId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await verifyArticleAccess(supabase, articleId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Unauthorized." : "Article not found." },
        { status: access.status },
      );
    }

    const ctx = await loadArticleContext(supabase, articleId);
    if (!ctx) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const memory = await buildArticleGenerationMemory({
      supabase,
      userId: access.userId,
      articleId,
      ctx,
    });

    const { content: html } = await generateArticleOutline(apiKey, ctx, memory);

    const { data: updated, error } = await supabase
      .from("articles")
      .update({
        content: html,
        status: "outline",
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId)
      .select("content, status, title")
      .maybeSingle();

    if (error || !updated) {
      return NextResponse.json(
        { error: "Failed to save outline.", details: error?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      content: updated.content,
      status: updated.status,
      title: updated.title,
    });
  } catch (error) {
    console.error("generate-outline article:", error);
    return NextResponse.json(
      { error: "Failed to generate article outline." },
      { status: 500 },
    );
  }
}
