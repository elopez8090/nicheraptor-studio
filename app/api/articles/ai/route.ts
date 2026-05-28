import { NextResponse } from "next/server";

import {
  generateArticleAiTool,
  normalizeSeoFieldValue,
} from "@/lib/ai/seo/generate-seo";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import {
  type ArticleAiToolId,
} from "@/lib/articles/article-ai-prompts";
import { loadArticleContext } from "@/lib/articles/load-article-for-ai";
import { verifyArticleAccess } from "@/lib/articles/verify-article-access";
import { createClient } from "@/lib/supabase/server";

const TOOLS: ArticleAiToolId[] = [
  "rewrite_section",
  "improve_intro",
  "add_faq",
  "meta_title",
  "meta_description",
  "slug",
];

function isArticleAiTool(value: unknown): value is ArticleAiToolId {
  return typeof value === "string" && TOOLS.includes(value as ArticleAiToolId);
}

type Body = {
  articleId?: string;
  tool?: unknown;
  text?: unknown;
  html?: unknown;
};

const MAX_TEXT = 12_000;
const MAX_HTML = 80_000;

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
    const articleId =
      typeof body.articleId === "string" ? body.articleId.trim() : "";
    if (!articleId) {
      return NextResponse.json({ error: "articleId is required." }, { status: 400 });
    }
    if (!isArticleAiTool(body.tool)) {
      return NextResponse.json({ error: "Invalid or missing tool." }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await verifyArticleAccess(supabase, articleId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Unauthorized." : "Article not found." },
        { status: access.status },
      );
    }

    const ctx = await loadArticleContext(supabase, articleId);
    if (!ctx) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const tool = body.tool;

    let userBody: string;
    if (tool === "rewrite_section") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) {
        return NextResponse.json(
          { error: "Select text to rewrite." },
          { status: 400 },
        );
      }
      if (text.length > MAX_TEXT) {
        return NextResponse.json({ error: "Selection is too long." }, { status: 400 });
      }
      userBody = text;
    } else {
      const html =
        typeof body.html === "string"
          ? body.html
          : typeof body.text === "string"
            ? body.text
            : "";
      if (!html.trim()) {
        return NextResponse.json(
          { error: "Article content is required for this tool." },
          { status: 400 },
        );
      }
      if (html.length > MAX_HTML) {
        return NextResponse.json({ error: "Article is too long." }, { status: 400 });
      }
      userBody = html;
    }

    const { content: result } = await generateArticleAiTool(
      apiKey,
      tool,
      ctx,
      userBody,
    );

    if (tool === "meta_title" || tool === "meta_description" || tool === "slug") {
      const column =
        tool === "meta_title"
          ? "meta_title"
          : tool === "meta_description"
            ? "meta_description"
            : "slug";
      const value = normalizeSeoFieldValue(tool, result);

      await supabase
        .from("articles")
        .update({ [column]: value, updated_at: new Date().toISOString() })
        .eq("id", articleId);

      return NextResponse.json({ result: value, field: column });
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("articles/ai:", error);
    return NextResponse.json({ error: "AI request failed." }, { status: 500 });
  }
}
