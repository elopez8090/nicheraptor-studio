import { NextResponse } from "next/server";

import type { ArticleTypeValue } from "@/lib/articles/article-constants";
import { ARTICLE_TYPE_OPTIONS } from "@/lib/articles/article-constants";
import { createClient } from "@/lib/supabase/server";

type CreateArticleBody = {
  topic?: unknown;
  targetKeyword?: unknown;
  secondaryKeywords?: unknown;
  audience?: unknown;
  tone?: unknown;
  articleType?: unknown;
  wordCountTarget?: unknown;
  title?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseSecondaryKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function isValidArticleType(value: string): value is ArticleTypeValue {
  return ARTICLE_TYPE_OPTIONS.some((o) => o.value === value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateArticleBody;
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const targetKeyword =
      typeof body.targetKeyword === "string" ? body.targetKeyword.trim() : "";
    const audience =
      typeof body.audience === "string" ? body.audience.trim() : "";
    const tone = typeof body.tone === "string" ? body.tone.trim() : "";

    if (!isNonEmptyString(topic) || !isNonEmptyString(targetKeyword)) {
      return NextResponse.json(
        { error: "Topic and target keyword are required." },
        { status: 400 },
      );
    }

    const articleTypeRaw =
      typeof body.articleType === "string" ? body.articleType.trim() : "blog_post";
    const articleType = isValidArticleType(articleTypeRaw)
      ? articleTypeRaw
      : "blog_post";

    let wordCountTarget: number | null = null;
    if (typeof body.wordCountTarget === "number" && body.wordCountTarget > 0) {
      wordCountTarget = Math.round(body.wordCountTarget);
    }

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : topic;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: inserted, error } = await supabase
      .from("articles")
      .insert({
        user_id: user.id,
        title,
        topic,
        target_keyword: targetKeyword,
        secondary_keywords: parseSecondaryKeywords(body.secondaryKeywords),
        audience,
        tone,
        article_type: articleType,
        word_count_target: wordCountTarget,
        status: "draft",
        content: "",
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return NextResponse.json(
        { error: "Failed to create article.", details: error?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ articleId: inserted.id });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating article." },
      { status: 500 },
    );
  }
}
