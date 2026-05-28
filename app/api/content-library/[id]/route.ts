import { NextResponse } from "next/server";

import { normalizeLibraryTags } from "@/lib/content-library/fetch-content-library";
import { syncContentLibraryTagsForUser } from "@/lib/content-library/sync-library-tags";
import { isContentLibraryType } from "@/lib/content-library/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("content_library_items")
    .select(
      "id, type, title, content, tags, favorite, usage_count, metadata, created_at, updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const input = body as {
    type?: unknown;
    title?: unknown;
    content?: unknown;
    tags?: unknown;
    favorite?: unknown;
    metadata?: unknown;
  };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.type !== undefined) {
    if (!isContentLibraryType(input.type)) {
      return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
    }
    patch.type = input.type;
  }

  if (typeof input.title === "string") {
    const title = input.title.trim();
    if (!title) {
      return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    patch.title = title;
  }

  if (typeof input.content === "string") {
    patch.content = input.content;
  }

  if (input.tags !== undefined) {
    patch.tags = normalizeLibraryTags(input.tags);
  }

  if (typeof input.favorite === "boolean") {
    patch.favorite = input.favorite;
  }

  if (input.metadata !== undefined) {
    patch.metadata =
      input.metadata &&
      typeof input.metadata === "object" &&
      !Array.isArray(input.metadata)
        ? input.metadata
        : {};
  }

  const { data, error } = await supabase
    .from("content_library_items")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, tags")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not found or update failed." }, { status: 404 });
  }

  if (Array.isArray(data.tags)) {
    await syncContentLibraryTagsForUser(supabase, user.id, data.tags as string[]);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("content_library_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
