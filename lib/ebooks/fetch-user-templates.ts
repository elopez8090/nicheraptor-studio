import type { EbookTemplateChapter } from "@/lib/ebooks/templates";
import { createClient } from "@/lib/supabase/server";

export type UserEbookTemplate = {
  id: string;
  name: string;
  description: string;
  defaultTitle: string;
  defaultAudience: string;
  defaultGoal: string;
  chapters: EbookTemplateChapter[];
  createdAt: string;
  updatedAt: string;
};

function parseChapters(raw: unknown): EbookTemplateChapter[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (ch): ch is EbookTemplateChapter =>
      Boolean(ch) &&
      typeof ch === "object" &&
      typeof (ch as EbookTemplateChapter).title === "string" &&
      typeof (ch as EbookTemplateChapter).summary === "string",
  );
}

export async function fetchUserEbookTemplates(): Promise<UserEbookTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ebook_templates")
    .select(
      "id, name, description, default_title, default_audience, default_goal, chapters, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    defaultTitle: row.default_title,
    defaultAudience: row.default_audience,
    defaultGoal: row.default_goal,
    chapters: parseChapters(row.chapters),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function fetchUserEbookTemplateById(
  templateId: string,
): Promise<UserEbookTemplate | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ebook_templates")
    .select(
      "id, name, description, default_title, default_audience, default_goal, chapters, created_at, updated_at",
    )
    .eq("id", templateId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "",
    defaultTitle: data.default_title,
    defaultAudience: data.default_audience,
    defaultGoal: data.default_goal,
    chapters: parseChapters(data.chapters),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
