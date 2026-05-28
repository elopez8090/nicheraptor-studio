import type { SupabaseClient } from "@supabase/supabase-js";
import type { LandingPageContext } from "@/lib/landing-pages/landing-page-ai-prompts";

export async function loadLandingPageContext(
  supabase: SupabaseClient,
  pageId: string,
): Promise<LandingPageContext | null> {
  const { data, error } = await supabase
    .from("landing_pages")
    .select("title, page_type, target_audience, offer, cta, tone, keyword_targeting")
    .eq("id", pageId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    title: data.title ?? "Landing page",
    pageType: data.page_type ?? "lead_magnet_page",
    targetAudience: data.target_audience ?? "",
    offer: data.offer ?? "",
    cta: data.cta ?? "",
    tone: data.tone ?? "",
    keywordTargeting: data.keyword_targeting ?? null,
  };
}
