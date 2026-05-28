import { verifyArticleAccess } from "@/lib/articles/verify-article-access";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { createClient } from "@/lib/supabase/server";

export type RepurposeSource =
  | {
      ok: true;
      sourceType: "manual";
      title: string;
      body: string;
      topic: string;
      audience: string;
      tone: string;
    }
  | {
      ok: true;
      sourceType: "article";
      title: string;
      body: string;
      topic: string;
      audience: string;
      tone: string;
      articleId: string;
    }
  | {
      ok: true;
      sourceType: "ebook_chapter";
      title: string;
      body: string;
      topic: string;
      audience: string;
      tone: string;
      ebookProjectId: string;
      chapterId: string;
    }
  | {
      ok: true;
      sourceType: "ebook";
      title: string;
      body: string;
      topic: string;
      audience: string;
      tone: string;
      ebookProjectId: string;
    }
  | { ok: false; status: number; error: string };

type SourceBody = {
  sourceType?: unknown;
  articleId?: unknown;
  ebookProjectId?: unknown;
  chapterId?: unknown;
  manualTitle?: unknown;
  manualBody?: unknown;
};

export async function loadRepurposeSource(body: SourceBody): Promise<RepurposeSource> {
  const supabase = await createClient();
  const sourceType =
    typeof body.sourceType === "string" ? body.sourceType.trim() : "";

  if (sourceType === "manual") {
    const title =
      typeof body.manualTitle === "string" ? body.manualTitle.trim() : "";
    const manualBody =
      typeof body.manualBody === "string" ? body.manualBody.trim() : "";
    if (!title || !manualBody) {
      return { ok: false, status: 400, error: "Manual title and body are required." };
    }
    return {
      ok: true,
      sourceType: "manual",
      title,
      body: manualBody,
      topic: title,
      audience: "",
      tone: "",
    };
  }

  if (sourceType === "article") {
    const articleId =
      typeof body.articleId === "string" ? body.articleId.trim() : "";
    if (!articleId) {
      return { ok: false, status: 400, error: "articleId is required." };
    }
    const access = await verifyArticleAccess(supabase, articleId);
    if (!access.ok) {
      return {
        ok: false,
        status: access.status,
        error: access.status === 401 ? "Unauthorized." : "Article not found.",
      };
    }
    const { data } = await supabase
      .from("articles")
      .select("id, title, content, topic, audience, tone")
      .eq("id", articleId)
      .maybeSingle();
    if (!data) {
      return { ok: false, status: 404, error: "Article not found." };
    }
    return {
      ok: true,
      sourceType: "article",
      title: String(data.title ?? ""),
      body: String(data.content ?? ""),
      topic: String(data.topic ?? ""),
      audience: String(data.audience ?? ""),
      tone: String(data.tone ?? ""),
      articleId,
    };
  }

  if (sourceType === "ebook_chapter") {
    const ebookProjectId =
      typeof body.ebookProjectId === "string" ? body.ebookProjectId.trim() : "";
    const chapterId =
      typeof body.chapterId === "string" ? body.chapterId.trim() : "";
    if (!ebookProjectId || !chapterId) {
      return {
        ok: false,
        status: 400,
        error: "ebookProjectId and chapterId are required.",
      };
    }
    const access = await verifyEbookProjectAccess(supabase, ebookProjectId);
    if (!access.ok) {
      return {
        ok: false,
        status: access.status,
        error: access.status === 401 ? "Unauthorized." : "Ebook not found.",
      };
    }
    const [{ data: project }, { data: chapter }] = await Promise.all([
      supabase
        .from("ebook_projects")
        .select("id, title, audience")
        .eq("id", ebookProjectId)
        .maybeSingle(),
      supabase
        .from("ebook_chapters")
        .select("id, title, content")
        .eq("id", chapterId)
        .eq("project_id", ebookProjectId)
        .maybeSingle(),
    ]);
    if (!project || !chapter) {
      return { ok: false, status: 404, error: "Chapter not found." };
    }
    return {
      ok: true,
      sourceType: "ebook_chapter",
      title: String(chapter.title ?? project.title ?? ""),
      body: String(chapter.content ?? ""),
      topic: String(project.title ?? ""),
      audience: String(project.audience ?? ""),
      tone: "",
      ebookProjectId,
      chapterId,
    };
  }

  if (sourceType === "ebook") {
    const ebookProjectId =
      typeof body.ebookProjectId === "string" ? body.ebookProjectId.trim() : "";
    if (!ebookProjectId) {
      return { ok: false, status: 400, error: "ebookProjectId is required." };
    }
    const access = await verifyEbookProjectAccess(supabase, ebookProjectId);
    if (!access.ok) {
      return {
        ok: false,
        status: access.status,
        error: access.status === 401 ? "Unauthorized." : "Ebook not found.",
      };
    }
    const { data: project } = await supabase
      .from("ebook_projects")
      .select("id, title, audience")
      .eq("id", ebookProjectId)
      .maybeSingle();
    if (!project) {
      return { ok: false, status: 404, error: "Ebook not found." };
    }
    const { data: chapters } = await supabase
      .from("ebook_chapters")
      .select("title, content, position")
      .eq("project_id", ebookProjectId)
      .order("position", { ascending: true });
    const combined = (chapters ?? [])
      .map((ch) => {
        const t = String(ch.title ?? "").trim();
        const c = String(ch.content ?? "").trim();
        if (!c) return "";
        return t ? `## ${t}\n\n${c}` : c;
      })
      .filter(Boolean)
      .join("\n\n");
    return {
      ok: true,
      sourceType: "ebook",
      title: String(project.title ?? ""),
      body: combined,
      topic: String(project.title ?? ""),
      audience: String(project.audience ?? ""),
      tone: "",
      ebookProjectId,
    };
  }

  return { ok: false, status: 400, error: "Invalid sourceType." };
}
