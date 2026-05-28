import { createClient } from "@/lib/supabase/server";
import { isContentLibraryType } from "@/lib/content-library/types";

export type WorkspaceSearchResultKind =
  | "ebook"
  | "article"
  | "note"
  | "snippet"
  | "framework"
  | "planner_topic"
  | "research"
  | "template"
  | "library";

export type WorkspaceSearchResult = {
  id: string;
  kind: WorkspaceSearchResultKind;
  title: string;
  subtitle?: string;
  href: string;
};

const LIMIT_PER_KIND = 8;

function matchQuery(text: string, q: string) {
  return text.toLowerCase().includes(q);
}

export async function searchWorkspace(
  query: string,
): Promise<WorkspaceSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) {
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const results: WorkspaceSearchResult[] = [];

  const [
    ebooksRes,
    articlesRes,
    notesRes,
    libraryRes,
    topicsRes,
    researchRes,
    templatesRes,
  ] = await Promise.all([
    supabase
      .from("ebook_projects")
      .select("id, title, audience, goal")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("articles")
      .select("id, title, target_keyword")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("project_notes")
      .select("id, title, body, project_id")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("content_library_items")
      .select("id, type, title, content")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(60),
    supabase
      .from("content_topics")
      .select("id, title, target_keyword, niche")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("ebook_research_entries")
      .select("id, title, summary, project_id")
      .order("updated_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_ebook_templates")
      .select("id, name, description")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(30),
  ]);

  const ebookCount = { n: 0 };
  for (const row of ebooksRes.data ?? []) {
    if (ebookCount.n >= LIMIT_PER_KIND) break;
    const hay = `${row.title} ${row.audience ?? ""} ${row.goal ?? ""}`;
    if (!matchQuery(hay, q)) continue;
    ebookCount.n += 1;
    results.push({
      id: row.id,
      kind: "ebook",
      title: row.title,
      subtitle: "Ebook project",
      href: `/ebooks/${row.id}/editor`,
    });
  }

  const articleCount = { n: 0 };
  for (const row of articlesRes.data ?? []) {
    if (articleCount.n >= LIMIT_PER_KIND) break;
    const hay = `${row.title} ${row.target_keyword ?? ""}`;
    if (!matchQuery(hay, q)) continue;
    articleCount.n += 1;
    results.push({
      id: row.id,
      kind: "article",
      title: row.title,
      subtitle: row.target_keyword ?? "Article",
      href: `/articles/${row.id}/editor`,
    });
  }

  const noteCount = { n: 0 };
  for (const row of notesRes.data ?? []) {
    if (noteCount.n >= LIMIT_PER_KIND) break;
    const hay = `${row.title ?? ""} ${row.body ?? ""}`;
    if (!matchQuery(hay, q)) continue;
    noteCount.n += 1;
    results.push({
      id: row.id,
      kind: "note",
      title: row.title || "Untitled note",
      subtitle: "Project note",
      href: `/ebooks/${row.project_id}/notes`,
    });
  }

  const snippetCount = { n: 0 };
  const frameworkCount = { n: 0 };
  const libraryCount = { n: 0 };
  for (const row of libraryRes.data ?? []) {
    if (!isContentLibraryType(row.type)) continue;
    const hay = `${row.title} ${row.content ?? ""}`;
    if (!matchQuery(hay, q)) continue;

    if (row.type === "snippet" && snippetCount.n < LIMIT_PER_KIND) {
      snippetCount.n += 1;
      results.push({
        id: row.id,
        kind: "snippet",
        title: row.title,
        subtitle: "Snippet",
        href: "/library/snippets",
      });
      continue;
    }
    if (row.type === "framework" && frameworkCount.n < LIMIT_PER_KIND) {
      frameworkCount.n += 1;
      results.push({
        id: row.id,
        kind: "framework",
        title: row.title,
        subtitle: "Framework",
        href: "/library/frameworks",
      });
      continue;
    }
    if (libraryCount.n < LIMIT_PER_KIND) {
      libraryCount.n += 1;
      results.push({
        id: row.id,
        kind: "library",
        title: row.title,
        subtitle: row.type,
        href: "/library",
      });
    }
  }

  const topicCount = { n: 0 };
  for (const row of topicsRes.data ?? []) {
    if (topicCount.n >= LIMIT_PER_KIND) break;
    const hay = `${row.title} ${row.target_keyword ?? ""} ${row.niche ?? ""}`;
    if (!matchQuery(hay, q)) continue;
    topicCount.n += 1;
    results.push({
      id: row.id,
      kind: "planner_topic",
      title: row.title,
      subtitle: "Planner topic",
      href: "/planner/topics",
    });
  }

  const researchCount = { n: 0 };
  for (const row of researchRes.data ?? []) {
    if (researchCount.n >= LIMIT_PER_KIND) break;
    const hay = `${row.title ?? ""} ${row.summary ?? ""}`;
    if (!matchQuery(hay, q)) continue;
    researchCount.n += 1;
    results.push({
      id: row.id,
      kind: "research",
      title: row.title || "Research entry",
      subtitle: "Research",
      href: `/ebooks/${row.project_id}/editor`,
    });
  }

  const templateCount = { n: 0 };
  for (const row of templatesRes.data ?? []) {
    if (templateCount.n >= LIMIT_PER_KIND) break;
    const hay = `${row.name} ${row.description ?? ""}`;
    if (!matchQuery(hay, q)) continue;
    templateCount.n += 1;
    results.push({
      id: row.id,
      kind: "template",
      title: row.name,
      subtitle: "Ebook template",
      href: "/templates",
    });
  }

  return results;
}
