import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LANDING_PAGE_STATUS_OPTIONS } from "@/lib/landing-pages/landing-page-constants";
import { verifyLandingPageAccess } from "@/lib/landing-pages/verify-landing-page-access";

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

type PatchBody = {
  title?: unknown;
  slug?: unknown;
  pageType?: unknown;
  targetAudience?: unknown;
  offer?: unknown;
  cta?: unknown;
  tone?: unknown;
  contentHtml?: unknown;
  seoTitle?: unknown;
  seoDescription?: unknown;
  keywordTargeting?: unknown;
  status?: unknown;
  builderState?: unknown;
};

function normalizeSlug(value: string): string | null {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  if (!pageId?.trim()) {
    return NextResponse.json({ error: "Page id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyLandingPageAccess(supabase, pageId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized." : "Landing page not found." },
      { status: access.status },
    );
  }

  const body = (await request.json()) as PatchBody;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") updates.title = body.title.trim() || "Untitled landing page";
  if (typeof body.slug === "string") updates.slug = normalizeSlug(body.slug);
  if (typeof body.pageType === "string") updates.page_type = body.pageType.trim();
  if (typeof body.targetAudience === "string") updates.target_audience = body.targetAudience.trim();
  if (typeof body.offer === "string") updates.offer = body.offer.trim();
  if (typeof body.cta === "string") updates.cta = body.cta.trim();
  if (typeof body.tone === "string") updates.tone = body.tone.trim();
  if (typeof body.contentHtml === "string") updates.content_html = body.contentHtml;
  if (typeof body.seoTitle === "string") updates.seo_title = body.seoTitle.trim() || null;
  if (typeof body.seoDescription === "string")
    updates.seo_description = body.seoDescription.trim() || null;
  if (typeof body.keywordTargeting === "string")
    updates.keyword_targeting = body.keywordTargeting.trim() || null;
  if (body.builderState && typeof body.builderState === "object")
    updates.builder_state = body.builderState;
  if (typeof body.status === "string") {
    const allowed = LANDING_PAGE_STATUS_OPTIONS.some((opt) => opt.value === body.status);
    if (allowed) updates.status = body.status;
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .update(updates)
    .eq("id", pageId)
    .select(
      "id, title, slug, page_type, target_audience, offer, cta, tone, content_html, seo_title, seo_description, keyword_targeting, status, updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update landing page.", details: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Landing page not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    slug: data.slug,
    pageType: data.page_type,
    targetAudience: data.target_audience,
    offer: data.offer,
    cta: data.cta,
    tone: data.tone,
    contentHtml: data.content_html,
    seoTitle: data.seo_title,
    seoDescription: data.seo_description,
    keywordTargeting: data.keyword_targeting,
    status: data.status,
    updatedAt: data.updated_at,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  if (!pageId?.trim()) {
    return NextResponse.json({ error: "Page id is required." }, { status: 400 });
  }
  const supabase = await createClient();
  const access = await verifyLandingPageAccess(supabase, pageId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized." : "Landing page not found." },
      { status: access.status },
    );
  }
  const { error } = await supabase.from("landing_pages").delete().eq("id", pageId);
  if (error) {
    return NextResponse.json(
      { error: "Failed to delete landing page.", details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
