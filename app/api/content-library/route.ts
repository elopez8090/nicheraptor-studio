import { NextResponse } from "next/server";

import {
  fetchContentLibraryItems,
  normalizeLibraryTags,
} from "@/lib/content-library/fetch-content-library";
import { syncContentLibraryTagsForUser } from "@/lib/content-library/sync-library-tags";
import {
  isContentLibraryType,
  type ContentLibraryType,
} from "@/lib/content-library/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type");
  const tag = searchParams.get("tag") ?? undefined;
  const favorite = searchParams.get("favorite") === "1";
  const search = searchParams.get("q") ?? undefined;
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  let type: ContentLibraryType | ContentLibraryType[] | undefined;
  if (typeParam) {
    const parts = typeParam.split(",").map((p) => p.trim());
    const valid = parts.filter(isContentLibraryType);
    if (valid.length === 1) {
      type = valid[0];
    } else if (valid.length > 1) {
      type = valid;
    }
  }

  const items = await fetchContentLibraryItems({
    type,
    tag,
    favorite: favorite || undefined,
    search,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
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

  if (!isContentLibraryType(input.type)) {
    return NextResponse.json({ error: "Invalid content type." }, { status: 400 });
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const content = typeof input.content === "string" ? input.content : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const tags = normalizeLibraryTags(input.tags);
  const metadata =
    input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
      ? (input.metadata as Record<string, unknown>)
      : {};

  const { data, error } = await supabase
    .from("content_library_items")
    .insert({
      user_id: user.id,
      type: input.type,
      title,
      content,
      tags,
      favorite: Boolean(input.favorite),
      metadata,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to save item." },
      { status: 500 },
    );
  }

  await syncContentLibraryTagsForUser(supabase, user.id, tags);

  return NextResponse.json({ itemId: data.id });
}
