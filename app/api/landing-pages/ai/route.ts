import { NextResponse } from "next/server";
import { runLandingPageAiTool } from "@/lib/ai/generators/landing-page";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import {
  type LandingPageAiToolId,
} from "@/lib/landing-pages/landing-page-ai-prompts";
import { loadLandingPageContext } from "@/lib/landing-pages/load-landing-page-for-ai";
import { verifyLandingPageAccess } from "@/lib/landing-pages/verify-landing-page-access";
import { createClient } from "@/lib/supabase/server";

const TOOLS: LandingPageAiToolId[] = [
  "improve_headline",
  "increase_urgency",
  "make_more_persuasive",
  "add_emotional_triggers",
  "improve_cta",
  "rewrite_for_clarity",
  "simplify_copy",
  "seo_title",
  "seo_description",
  "slug",
];

function isTool(value: unknown): value is LandingPageAiToolId {
  return typeof value === "string" && TOOLS.includes(value as LandingPageAiToolId);
}

type Body = {
  pageId?: string;
  tool?: unknown;
  text?: unknown;
  html?: unknown;
};

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
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

    const body = (await request.json()) as Body;
    const pageId = typeof body.pageId === "string" ? body.pageId.trim() : "";
    if (!pageId) {
      return NextResponse.json({ error: "pageId is required." }, { status: 400 });
    }
    if (!isTool(body.tool)) {
      return NextResponse.json({ error: "Invalid or missing tool." }, { status: 400 });
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

    const input =
      typeof body.text === "string"
        ? body.text
        : typeof body.html === "string"
          ? body.html
          : "";
    if (!input.trim()) {
      return NextResponse.json({ error: "Input text is required." }, { status: 400 });
    }

    const tool = body.tool;
    const { content } = await runLandingPageAiTool(apiKey, tool, ctx, input);
    const result = content.trim();

    if (tool === "seo_title" || tool === "seo_description" || tool === "slug") {
      const field =
        tool === "seo_title" ? "seo_title" : tool === "seo_description" ? "seo_description" : "slug";
      const value = tool === "slug" ? normalizeSlug(result) : result.replace(/^["']|["']$/g, "");

      await supabase
        .from("landing_pages")
        .update({ [field]: value || null, updated_at: new Date().toISOString() })
        .eq("id", pageId);

      return NextResponse.json({ result: value, field });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("landing-pages/ai:", error);
    return NextResponse.json({ error: "AI request failed." }, { status: 500 });
  }
}
