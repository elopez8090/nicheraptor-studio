import { createClient } from "@/lib/supabase/server";
import {
  isContentLibraryType,
  type ContentLibraryItem,
  type ContentLibraryListFilters,
  type ContentLibraryTag,
  type ContentLibraryType,
} from "@/lib/content-library/types";

type LibraryItemRow = {
  id: string;
  type: string;
  title: string;
  content: string;
  tags: string[] | null;
  favorite: boolean;
  usage_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function rowToItem(row: LibraryItemRow): ContentLibraryItem | null {
  if (!isContentLibraryType(row.type)) {
    return null;
  }
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    favorite: Boolean(row.favorite),
    usageCount: row.usage_count ?? 0,
    metadata:
      row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchContentLibraryItems(
  filters: ContentLibraryListFilters = {},
): Promise<ContentLibraryItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  let query = supabase
    .from("content_library_items")
    .select(
      "id, type, title, content, tags, favorite, usage_count, metadata, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (filters.favorite === true) {
    query = query.eq("favorite", true);
  }

  if (filters.type) {
    const types = Array.isArray(filters.type) ? filters.type : [filters.type];
    query = query.in("type", types);
  }

  if (filters.tag?.trim()) {
    query = query.contains("tags", [filters.tag.trim()]);
  }

  if (typeof filters.limit === "number" && filters.limit > 0) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  let items = data
    .map((row) => rowToItem(row as LibraryItemRow))
    .filter((item): item is ContentLibraryItem => item !== null);

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.content.toLowerCase().includes(search) ||
        item.tags.some((t) => t.toLowerCase().includes(search)),
    );
  }

  return items;
}

export async function fetchContentLibraryItemById(
  id: string,
): Promise<ContentLibraryItem | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
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
    return null;
  }

  return rowToItem(data as LibraryItemRow);
}

export async function fetchContentLibraryTags(): Promise<ContentLibraryTag[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("content_library_tags")
    .select("id, name, created_at")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    createdAt: row.created_at as string,
  }));
}

export async function fetchLibraryFrameworkContent(
  frameworkId: string,
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_library_items")
    .select("content, type")
    .eq("id", frameworkId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || data.type !== "framework") {
    return null;
  }

  return typeof data.content === "string" ? data.content : null;
}

export function normalizeLibraryTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") {
      continue;
    }
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

export function parseContentLibraryTypeFilter(
  types: readonly ContentLibraryType[],
): ContentLibraryType[] {
  return [...types];
}
