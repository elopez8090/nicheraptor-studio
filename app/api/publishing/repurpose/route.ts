import { NextResponse } from "next/server";

import { generateRepurposingContent } from "@/lib/ai/generators/repurposing";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { isRepurposingWorkflow } from "@/lib/publishing/constants";
import { loadRepurposeSource } from "@/lib/publishing/load-repurpose-source";
import { mapRepurposingJobRow } from "@/lib/publishing/map-rows";
import { createClient } from "@/lib/supabase/server";

type RepurposeBody = {
  workflow?: unknown;
  sourceType?: unknown;
  articleId?: unknown;
  ebookProjectId?: unknown;
  chapterId?: unknown;
  manualTitle?: unknown;
  manualBody?: unknown;
  templateId?: unknown;
  addToQueue?: unknown;
  createArticle?: unknown;
};

function workflowToContentType(workflow: string): string {
  if (workflow.includes("newsletter")) return "newsletter";
  if (workflow.includes("social") || workflow.includes("tweet") || workflow.includes("linkedin")) {
    return "social";
  }
  if (workflow.includes("faq")) return "faq";
  if (workflow.includes("thread")) return "thread";
  if (workflow.includes("lead_magnet")) return "lead_magnet";
  return "article";
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

    const body = (await request.json()) as RepurposeBody;
    const workflow =
      typeof body.workflow === "string" ? body.workflow.trim() : "";
    if (!isRepurposingWorkflow(workflow)) {
      return NextResponse.json({ error: "Invalid workflow." }, { status: 400 });
    }

    const source = await loadRepurposeSource(body);
    if (!source.ok) {
      return NextResponse.json({ error: source.error }, { status: source.status });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    let templateBody: string | undefined;
    if (typeof body.templateId === "string" && body.templateId) {
      const { data: template } = await supabase
        .from("publishing_templates")
        .select("body")
        .eq("id", body.templateId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (template?.body) {
        templateBody = String(template.body);
      }
    }

    const jobInsert = await supabase
      .from("content_repurposing_jobs")
      .insert({
        workflow,
        source_type: source.sourceType,
        source_article_id:
          source.sourceType === "article" ? source.articleId : null,
        source_ebook_project_id:
          source.sourceType === "ebook" || source.sourceType === "ebook_chapter"
            ? source.ebookProjectId
            : null,
        source_chapter_id:
          source.sourceType === "ebook_chapter" ? source.chapterId : null,
        status: "running",
        input_snapshot: {
          title: source.title,
          workflow,
        },
      })
      .select("*")
      .single();

    const jobId = jobInsert.data?.id;

    try {
      const result = await generateRepurposingContent(apiKey, {
        workflow,
        title: source.title,
        body: source.body,
        topic: source.topic,
        audience: source.audience,
        tone: source.tone,
        templateBody,
      });

      const output = {
        text: result.content,
        meta: result.meta,
      };

      if (jobId) {
        await supabase
          .from("content_repurposing_jobs")
          .update({
            status: "completed",
            output,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId)
          .eq("user_id", user.id);
      }

      let queueItemId: string | null = null;
      let articleId: string | null = null;

      const shouldQueue = body.addToQueue !== false;
      const shouldCreateArticle =
        body.createArticle === true ||
        workflow === "convert_to_article" ||
        workflow === "ebook_chapter_to_article";

      if (shouldCreateArticle && result.content.trim()) {
        const topic = source.topic || source.title || "Repurposed article";
        const { data: article, error: articleError } = await supabase
          .from("articles")
          .insert({
            title: source.title || topic,
            topic,
            target_keyword: topic.slice(0, 80),
            audience: source.audience || "",
            tone: source.tone || "",
            content: result.content,
            status: "draft",
          })
          .select("id")
          .single();
        if (!articleError && article?.id) {
          articleId = String(article.id);
        }
      }

      if (shouldQueue) {
        const contentType = workflowToContentType(workflow);
        const { data: queueRow } = await supabase
          .from("publishing_queue")
          .insert({
            title: `${source.title} — ${workflow.replace(/_/g, " ")}`,
            body_html: result.content.includes("<") ? result.content : "",
            body_markdown: result.content.includes("<") ? "" : result.content,
            source_type: "repurposed",
            source_article_id:
              source.sourceType === "article" ? source.articleId : articleId,
            source_ebook_project_id:
              source.sourceType === "ebook" || source.sourceType === "ebook_chapter"
                ? source.ebookProjectId
                : null,
            source_chapter_id:
              source.sourceType === "ebook_chapter" ? source.chapterId : null,
            status: "draft",
            content_type: contentType,
            target_platform: "markdown_export",
            metadata: { workflow, repurposed: true },
          })
          .select("id")
          .single();
        if (queueRow?.id) {
          queueItemId = String(queueRow.id);
        }
      }

      return NextResponse.json({
        content: result.content,
        output,
        queueItemId,
        articleId,
        job: jobInsert.data
          ? mapRepurposingJobRow({
              ...jobInsert.data,
              status: "completed",
              output,
              completed_at: new Date().toISOString(),
            } as Record<string, unknown>)
          : null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Repurposing failed.";
      if (jobId) {
        await supabase
          .from("content_repurposing_jobs")
          .update({
            status: "failed",
            error_message: message,
            completed_at: new Date().toISOString(),
          })
          .eq("id", jobId)
          .eq("user_id", user.id);
      }
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
