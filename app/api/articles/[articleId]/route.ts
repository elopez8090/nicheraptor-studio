import { NextResponse } from "next/server";

import { ARTICLE_STATUS_OPTIONS } from "@/lib/articles/article-constants";
import { verifyArticleAccess } from "@/lib/articles/verify-article-access";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

type PatchBody = {
  title?: unknown;
  content?: unknown;
  metaTitle?: unknown;
  metaDescription?: unknown;
  slug?: unknown;
  status?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { articleId } = await context.params;
  if (!articleId?.trim()) {
    return NextResponse.json({ error: "Article id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyArticleAccess(supabase, articleId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized." : "Article not found." },
      { status: access.status },
    );
  }

  const body = (await request.json()) as PatchBody;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.title === "string") {
    updates.title = body.title.trim() || "Untitled article";
  }
  if (typeof body.content === "string") {
    updates.content = body.content;
  }
  if (body.metaTitle === null) {
    updates.meta_title = null;
  } else if (typeof body.metaTitle === "string") {
    updates.meta_title = body.metaTitle.trim() || null;
  }
  if (body.metaDescription === null) {
    updates.meta_description = null;
  } else if (typeof body.metaDescription === "string") {
    updates.meta_description = body.metaDescription.trim() || null;
  }
  if (body.slug === null) {
    updates.slug = null;
  } else if (typeof body.slug === "string") {
    updates.slug = body.slug.trim().replace(/^\/+/, "") || null;
  }
  if (typeof body.status === "string") {
    const allowed = ARTICLE_STATUS_OPTIONS.some((o) => o.value === body.status);
    if (allowed) {
      updates.status = body.status;
    }
  }

  const { data, error } = await supabase
    .from("articles")
    .update(updates)
    .eq("id", articleId)
    .select(
      "id, title, content, meta_title, meta_description, slug, status, updated_at",
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update article.", details: error.message },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    title: data.title,
    content: data.content,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    slug: data.slug,
    status: data.status,
    updatedAt: data.updated_at,
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { articleId } = await context.params;
  if (!articleId?.trim()) {
    return NextResponse.json({ error: "Article id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyArticleAccess(supabase, articleId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized." : "Article not found." },
      { status: access.status },
    );
  }

  const { error } = await supabase.from("articles").delete().eq("id", articleId);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete article.", details: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
