import { createClient } from "@/lib/supabase/server";
import type { ArticleTypeValue } from "@/lib/articles/article-constants";

export type ArticleRecord = {
  id: string;
  title: string;
  topic: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  audience: string;
  tone: string;
  articleType: ArticleTypeValue | string;
  status: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  slug: string | null;
  wordCountTarget: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function fetchArticle(
  articleId: string,
): Promise<ArticleRecord | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, topic, target_keyword, secondary_keywords, audience, tone, article_type, status, content, meta_title, meta_description, slug, word_count_target, created_at, updated_at",
    )
    .eq("id", articleId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    topic: data.topic ?? "",
    targetKeyword: data.target_keyword ?? "",
    secondaryKeywords: Array.isArray(data.secondary_keywords)
      ? data.secondary_keywords
      : [],
    audience: data.audience ?? "",
    tone: data.tone ?? "",
    articleType: data.article_type ?? "blog_post",
    status: data.status ?? "draft",
    content: data.content ?? "",
    metaTitle: data.meta_title ?? null,
    metaDescription: data.meta_description ?? null,
    slug: data.slug ?? null,
    wordCountTarget: data.word_count_target ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
