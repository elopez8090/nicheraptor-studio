import { NextResponse } from "next/server";

import {
  isPlannerIdeaType,
  isPlannerWorkflowStatus,
} from "@/lib/planner/constants";
import { mapTopicRow } from "@/lib/planner/map-rows";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ topicId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { topicId } = await context.params;
  if (!topicId) {
    return NextResponse.json({ error: "Topic id required." }, { status: 400 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.niche === "string") patch.niche = body.niche.trim();
  if (typeof body.targetKeyword === "string") {
    patch.target_keyword = body.targetKeyword.trim();
  }
  if (typeof body.ideaType === "string" && isPlannerIdeaType(body.ideaType)) {
    patch.idea_type = body.ideaType;
  }
  if (
    typeof body.workflowStatus === "string" &&
    isPlannerWorkflowStatus(body.workflowStatus)
  ) {
    patch.workflow_status = body.workflowStatus;
  }
  if (typeof body.priority === "number") patch.priority = Math.round(body.priority);
  if (body.clusterId === null) patch.cluster_id = null;
  if (typeof body.clusterId === "string") patch.cluster_id = body.clusterId || null;
  if (body.linkedEbookProjectId === null) patch.linked_ebook_project_id = null;
  if (typeof body.linkedEbookProjectId === "string") {
    patch.linked_ebook_project_id = body.linkedEbookProjectId || null;
  }
  if (body.linkedArticleId === null) patch.linked_article_id = null;
  if (typeof body.linkedArticleId === "string") {
    patch.linked_article_id = body.linkedArticleId || null;
  }
  if (typeof body.sortOrder === "number") patch.sort_order = Math.round(body.sortOrder);
  if (body.metadata && typeof body.metadata === "object") {
    patch.metadata = body.metadata;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("content_topics")
    .update(patch)
    .eq("id", topicId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ topic: mapTopicRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { topicId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase.from("content_topics").delete().eq("id", topicId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
