import { NextResponse } from "next/server";

import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";
import { mapPublishingTargetRow } from "@/lib/publishing/map-rows";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPublishingSnapshot();
  return NextResponse.json({ targets: snapshot.targets });
}

type PatchTargetBody = {
  targetId?: unknown;
  isEnabled?: unknown;
  name?: unknown;
  config?: unknown;
  webhookUrl?: unknown;
  rssFeedUrl?: unknown;
  metadata?: unknown;
};

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as PatchTargetBody;
    const targetId =
      typeof body.targetId === "string" ? body.targetId.trim() : "";
    if (!targetId) {
      return NextResponse.json({ error: "targetId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.isEnabled === "boolean") patch.is_enabled = body.isEnabled;
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (body.config && typeof body.config === "object") patch.config = body.config;
    if (typeof body.webhookUrl === "string") {
      patch.webhook_url = body.webhookUrl.trim() || null;
    }
    if (typeof body.rssFeedUrl === "string") {
      patch.rss_feed_url = body.rssFeedUrl.trim() || null;
    }
    if (body.metadata && typeof body.metadata === "object") {
      patch.metadata = body.metadata;
    }

    const { data, error } = await supabase
      .from("publishing_targets")
      .update(patch)
      .eq("id", targetId)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Target not found." }, { status: 404 });
    }

    return NextResponse.json({
      target: mapPublishingTargetRow(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
