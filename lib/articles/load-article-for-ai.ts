import type { SupabaseClient } from "@supabase/supabase-js";

import type { ArticleContext } from "@/lib/articles/article-ai-prompts";

export async function loadArticleContext(
  supabase: SupabaseClient,
  articleId: string,
): Promise<ArticleContext | null> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "title, topic, target_keyword, secondary_keywords, audience, tone, article_type, word_count_target",
    )
    .eq("id", articleId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    title: data.title ?? "",
    topic: data.topic ?? "",
    targetKeyword: data.target_keyword ?? "",
    secondaryKeywords: Array.isArray(data.secondary_keywords)
      ? data.secondary_keywords
      : [],
    audience: data.audience ?? "",
    tone: data.tone ?? "",
    articleType: data.article_type ?? "blog_post",
    wordCountTarget: data.word_count_target ?? null,
  };
}
