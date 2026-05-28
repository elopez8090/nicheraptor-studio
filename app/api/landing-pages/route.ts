import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  LANDING_PAGE_TYPE_OPTIONS,
  type LandingPageTypeValue,
} from "@/lib/landing-pages/landing-page-constants";

type CreateLandingPageBody = {
  title?: unknown;
  slug?: unknown;
  pageType?: unknown;
  targetAudience?: unknown;
  offer?: unknown;
  cta?: unknown;
  tone?: unknown;
  keywordTargeting?: unknown;
};

function isValidPageType(value: string): value is LandingPageTypeValue {
  return LANDING_PAGE_TYPE_OPTIONS.some((opt) => opt.value === value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateLandingPageBody;
    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim()
        : "Untitled landing page";
    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
        : null;

    const pageTypeRaw =
      typeof body.pageType === "string" ? body.pageType.trim() : "lead_magnet_page";
    const pageType = isValidPageType(pageTypeRaw) ? pageTypeRaw : "lead_magnet_page";

    const targetAudience =
      typeof body.targetAudience === "string" ? body.targetAudience.trim() : "";
    const offer = typeof body.offer === "string" ? body.offer.trim() : "";
    const cta = typeof body.cta === "string" ? body.cta.trim() : "";
    const tone = typeof body.tone === "string" ? body.tone.trim() : "";
    const keywordTargeting =
      typeof body.keywordTargeting === "string" ? body.keywordTargeting.trim() : "";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("landing_pages")
      .insert({
        user_id: user.id,
        title,
        slug,
        page_type: pageType,
        target_audience: targetAudience,
        offer,
        cta,
        tone,
        keyword_targeting: keywordTargeting || null,
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to create landing page.", details: error?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ pageId: data.id });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while creating landing page." },
      { status: 500 },
    );
  }
}
