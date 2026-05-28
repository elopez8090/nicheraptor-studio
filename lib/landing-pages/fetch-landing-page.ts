import { createClient } from "@/lib/supabase/server";

export type LandingPageRecord = {
  id: string;
  title: string;
  slug: string | null;
  pageType: string;
  targetAudience: string;
  offer: string;
  cta: string;
  tone: string;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  keywordTargeting: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export async function fetchLandingPage(pageId: string): Promise<LandingPageRecord | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .select(
      "id, title, slug, page_type, target_audience, offer, cta, tone, content_html, seo_title, seo_description, keyword_targeting, status, created_at, updated_at",
    )
    .eq("id", pageId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    slug: data.slug ?? null,
    pageType: data.page_type ?? "lead_magnet_page",
    targetAudience: data.target_audience ?? "",
    offer: data.offer ?? "",
    cta: data.cta ?? "",
    tone: data.tone ?? "",
    contentHtml: data.content_html ?? "",
    seoTitle: data.seo_title ?? null,
    seoDescription: data.seo_description ?? null,
    keywordTargeting: data.keyword_targeting ?? null,
    status: data.status ?? "draft",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
