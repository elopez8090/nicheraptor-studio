import { NextResponse } from "next/server";

import { verifyArticleAccess } from "@/lib/articles/verify-article-access";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { articleId: sourceId } = await context.params;
  if (!sourceId?.trim()) {
    return NextResponse.json({ error: "Article id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyArticleAccess(supabase, sourceId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized." : "Article not found." },
      { status: access.status },
    );
  }

  const { data: source, error: sourceError } = await supabase
    .from("articles")
    .select(
      "title, topic, target_keyword, secondary_keywords, audience, tone, article_type, content, meta_title, meta_description, slug, word_count_target",
    )
    .eq("id", sourceId)
    .maybeSingle();

  if (sourceError || !source) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const copyTitle = `${source.title.replace(/\s*\(copy\)\s*$/i, "")} (Copy)`;

  const { data: inserted, error: insertError } = await supabase
    .from("articles")
    .insert({
      user_id: access.userId,
      title: copyTitle,
      topic: source.topic,
      target_keyword: source.target_keyword,
      secondary_keywords: source.secondary_keywords ?? [],
      audience: source.audience,
      tone: source.tone,
      article_type: source.article_type,
      content: source.content ?? "",
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      slug: null,
      word_count_target: source.word_count_target,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: "Failed to duplicate article.", details: insertError?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ articleId: inserted.id });
}
