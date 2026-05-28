import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeLibraryTags } from "@/lib/content-library/fetch-content-library";

/** Upsert tag rows for autocomplete / filter UI (items still store tags as text[]). */
export async function syncContentLibraryTagsForUser(
  supabase: SupabaseClient,
  userId: string,
  tags: string[],
): Promise<void> {
  const normalized = normalizeLibraryTags(tags);
  if (normalized.length === 0) {
    return;
  }

  const rows = normalized.map((name) => ({
    user_id: userId,
    name: name.toLowerCase(),
  }));

  await supabase.from("content_library_tags").upsert(rows, {
    onConflict: "user_id,name",
    ignoreDuplicates: true,
  });
}
