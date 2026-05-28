import { createClient } from "@/lib/supabase/server";

export type ArticleListItem = {
  id: string;
  title: string;
  targetKeyword: string;
  status: string;
  updatedAt: string;
  articleType: string;
};

export async function fetchArticles(): Promise<ArticleListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, target_keyword, status, updated_at, article_type")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    targetKeyword: row.target_keyword ?? "",
    status: row.status ?? "draft",
    updatedAt: row.updated_at,
    articleType: row.article_type ?? "blog_post",
  }));
}
