import type { SupabaseClient } from "@supabase/supabase-js";

export async function verifyEbookProjectAccess(
  supabase: SupabaseClient,
  projectId: string,
): Promise<{ ok: true; userId: string } | { ok: false; status: 401 | 404 }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, status: 401 };
  }

  const { data: project, error: projectError } = await supabase
    .from("ebook_projects")
    .select("id, user_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, status: 404 };
  }

  return { ok: true, userId: user.id };
}
