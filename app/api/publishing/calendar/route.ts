import { NextResponse } from "next/server";

import {
  isPublishingContentType,
  isPublishingPlatformType,
} from "@/lib/publishing/constants";
import { mapContentCalendarRow } from "@/lib/publishing/map-rows";
import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPublishingSnapshot();
  return NextResponse.json({ entries: snapshot.calendar });
}

type CreateCalendarBody = {
  title?: unknown;
  plannedPublishDate?: unknown;
  publishingPriority?: unknown;
  contentType?: unknown;
  targetPlatform?: unknown;
  queueId?: unknown;
  notes?: unknown;
  metadata?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCalendarBody;
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

    const contentRaw =
      typeof body.contentType === "string" ? body.contentType.trim() : "article";
    const contentType = isPublishingContentType(contentRaw)
      ? contentRaw
      : "article";

    const platformRaw =
      typeof body.targetPlatform === "string"
        ? body.targetPlatform.trim()
        : "markdown_export";
    const targetPlatform = isPublishingPlatformType(platformRaw)
      ? platformRaw
      : "markdown_export";

    const { data, error } = await supabase
      .from("content_calendar")
      .insert({
        title,
        planned_publish_date:
          typeof body.plannedPublishDate === "string" && body.plannedPublishDate
            ? body.plannedPublishDate
            : null,
        publishing_priority:
          typeof body.publishingPriority === "number"
            ? Math.round(body.publishingPriority)
            : 0,
        content_type: contentType,
        target_platform: targetPlatform,
        queue_id:
          typeof body.queueId === "string" && body.queueId ? body.queueId : null,
        notes: typeof body.notes === "string" ? body.notes.trim() : "",
        metadata:
          body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create calendar entry." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      entry: mapContentCalendarRow(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
