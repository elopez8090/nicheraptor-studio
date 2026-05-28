import { createClient } from "@/lib/supabase/server";

export type LandingPageListItem = {
  id: string;
  title: string;
  slug: string | null;
  pageType: string;
  status: string;
  seoTitle: string | null;
  updatedAt: string;
};

export async function fetchLandingPages(): Promise<LandingPageListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .select("id, title, slug, page_type, status, seo_title, updated_at")
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug ?? null,
    pageType: row.page_type ?? "lead_magnet_page",
    status: row.status ?? "draft",
    seoTitle: row.seo_title ?? null,
    updatedAt: row.updated_at,
  }));
}
