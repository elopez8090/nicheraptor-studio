import { NextResponse } from "next/server";

import {
  isPublishingContentType,
  isPublishingPlatformType,
  isPublishingQueueStatus,
} from "@/lib/publishing/constants";
import { mapPublishingQueueRow } from "@/lib/publishing/map-rows";
import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPublishingSnapshot();
  return NextResponse.json({ items: snapshot.queue });
}

type CreateQueueBody = {
  title?: unknown;
  bodyHtml?: unknown;
  bodyMarkdown?: unknown;
  sourceType?: unknown;
  sourceArticleId?: unknown;
  sourceEbookProjectId?: unknown;
  sourceChapterId?: unknown;
  publishingTargetId?: unknown;
  targetPlatform?: unknown;
  status?: unknown;
  contentType?: unknown;
  priority?: unknown;
  scheduledAt?: unknown;
  metadata?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateQueueBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const statusRaw =
      typeof body.status === "string" ? body.status.trim() : "draft";
    const status = isPublishingQueueStatus(statusRaw) ? statusRaw : "draft";

    const platformRaw =
      typeof body.targetPlatform === "string"
        ? body.targetPlatform.trim()
        : "markdown_export";
    const targetPlatform = isPublishingPlatformType(platformRaw)
      ? platformRaw
      : "markdown_export";

    const contentRaw =
      typeof body.contentType === "string" ? body.contentType.trim() : "article";
    const contentType = isPublishingContentType(contentRaw)
      ? contentRaw
      : "article";

    const { data, error } = await supabase
      .from("publishing_queue")
      .insert({
        title,
        body_html: typeof body.bodyHtml === "string" ? body.bodyHtml : "",
        body_markdown:
          typeof body.bodyMarkdown === "string" ? body.bodyMarkdown : "",
        source_type:
          typeof body.sourceType === "string" ? body.sourceType.trim() : "manual",
        source_article_id:
          typeof body.sourceArticleId === "string" && body.sourceArticleId
            ? body.sourceArticleId
            : null,
        source_ebook_project_id:
          typeof body.sourceEbookProjectId === "string" && body.sourceEbookProjectId
            ? body.sourceEbookProjectId
            : null,
        source_chapter_id:
          typeof body.sourceChapterId === "string" && body.sourceChapterId
            ? body.sourceChapterId
            : null,
        publishing_target_id:
          typeof body.publishingTargetId === "string" && body.publishingTargetId
            ? body.publishingTargetId
            : null,
        target_platform: targetPlatform,
        status,
        content_type: contentType,
        priority:
          typeof body.priority === "number" ? Math.round(body.priority) : 0,
        scheduled_at:
          typeof body.scheduledAt === "string" && body.scheduledAt
            ? body.scheduledAt
            : null,
        metadata:
          body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to add to queue." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      item: mapPublishingQueueRow(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
