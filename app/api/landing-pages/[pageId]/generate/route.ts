import { NextResponse } from "next/server";
import { generateLandingPage } from "@/lib/ai/generators/landing-page";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { loadLandingPageContext } from "@/lib/landing-pages/load-landing-page-for-ai";
import { createClient } from "@/lib/supabase/server";
import { verifyLandingPageAccess } from "@/lib/landing-pages/verify-landing-page-access";

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  try {
    let apiKey: string;
    try {
      apiKey = requireOpenAiApiKey();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error: missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const { pageId } = await context.params;
    if (!pageId?.trim()) {
      return NextResponse.json({ error: "pageId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await verifyLandingPageAccess(supabase, pageId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Unauthorized." : "Landing page not found." },
        { status: access.status },
      );
    }

    const ctx = await loadLandingPageContext(supabase, pageId);
    if (!ctx) {
      return NextResponse.json({ error: "Landing page not found." }, { status: 404 });
    }

    const { content } = await generateLandingPage(apiKey, ctx);

    const { data, error } = await supabase
      .from("landing_pages")
      .update({
        content_html: content,
        status: "generated",
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .select("content_html, status")
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to save generated page.", details: error?.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      contentHtml: data.content_html,
      status: data.status,
    });
  } catch (error) {
    console.error("landing-pages/generate:", error);
    return NextResponse.json({ error: "Failed to generate landing page." }, { status: 500 });
  }
}
