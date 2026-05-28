import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchFavoriteLibrarySnippets(
  supabase: SupabaseClient,
  userId: string,
  limit = 3,
): Promise<Array<{ title: string; content: string }>> {
  const { data, error } = await supabase
    .from("content_library_items")
    .select("title, content, type, favorite")
    .eq("user_id", userId)
    .eq("favorite", true)
    .in("type", ["snippet", "framework", "prompt"])
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return [];
  }

  return data
    .filter((row) => typeof row.content === "string" && row.content.trim())
    .map((row) => ({
      title: String(row.title ?? "Snippet"),
      content: String(row.content),
    }));
}
