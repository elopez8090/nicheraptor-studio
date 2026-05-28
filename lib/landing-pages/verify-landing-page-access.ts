import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyLandingPageAccess(
  supabase: SupabaseClient,
  pageId: string,
): Promise<{ ok: true; userId: string } | { ok: false; status: 401 | 404 }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401 };
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .select("id, user_id")
    .eq("id", pageId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false, status: 404 };
  }

  return { ok: true, userId: user.id };
}
