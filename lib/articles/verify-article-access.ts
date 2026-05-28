import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyArticleAccess(
  supabase: SupabaseClient,
  articleId: string,
): Promise<{ ok: true; userId: string } | { ok: false; status: 401 | 404 }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401 };
  }

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, user_id")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError || !article) {
    return { ok: false, status: 404 };
  }

  return { ok: true, userId: user.id };
}
