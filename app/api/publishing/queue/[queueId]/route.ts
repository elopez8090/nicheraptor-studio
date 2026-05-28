import { NextResponse } from "next/server";

import {
  isPublishingContentType,
  isPublishingPlatformType,
  isPublishingQueueStatus,
} from "@/lib/publishing/constants";
import { mapPublishingQueueRow } from "@/lib/publishing/map-rows";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ queueId: string }> };

type PatchBody = {
  title?: unknown;
  bodyHtml?: unknown;
  bodyMarkdown?: unknown;
  status?: unknown;
  contentType?: unknown;
  targetPlatform?: unknown;
  priority?: unknown;
  scheduledAt?: unknown;
  publishedAt?: unknown;
  errorMessage?: unknown;
  metadata?: unknown;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { queueId } = await context.params;
    const body = (await request.json()) as PatchBody;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.bodyHtml === "string") patch.body_html = body.bodyHtml;
    if (typeof body.bodyMarkdown === "string") patch.body_markdown = body.bodyMarkdown;

    if (typeof body.status === "string") {
      const status = body.status.trim();
      if (isPublishingQueueStatus(status)) {
        patch.status = status;
        if (status === "published") {
          patch.published_at = new Date().toISOString();
          patch.error_message = null;
        }
        if (status === "failed" && typeof body.errorMessage === "string") {
          patch.error_message = body.errorMessage;
        }
      }
    }

    if (typeof body.contentType === "string") {
      const ct = body.contentType.trim();
      if (isPublishingContentType(ct)) patch.content_type = ct;
    }

    if (typeof body.targetPlatform === "string") {
      const tp = body.targetPlatform.trim();
      if (isPublishingPlatformType(tp)) patch.target_platform = tp;
    }

    if (typeof body.priority === "number") {
      patch.priority = Math.round(body.priority);
    }

    if (body.scheduledAt === null) {
      patch.scheduled_at = null;
    } else if (typeof body.scheduledAt === "string" && body.scheduledAt) {
      patch.scheduled_at = body.scheduledAt;
    }

    if (typeof body.publishedAt === "string") {
      patch.published_at = body.publishedAt;
    }

    if (body.metadata && typeof body.metadata === "object") {
      patch.metadata = body.metadata;
    }

    const { data, error } = await supabase
      .from("publishing_queue")
      .update(patch)
      .eq("id", queueId)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Queue item not found." }, { status: 404 });
    }

    return NextResponse.json({
      item: mapPublishingQueueRow(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { queueId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("publishing_queue")
    .delete()
    .eq("id", queueId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
