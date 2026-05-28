import { NextResponse } from "next/server";

import {
  ideaTypeForGenerationMode,
  isPlannerIdeaType,
  isPlannerWorkflowStatus,
} from "@/lib/planner/constants";
import { mapTopicRow } from "@/lib/planner/map-rows";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPlannerSnapshot();
  return NextResponse.json({ topics: snapshot.topics });
}

type CreateTopicBody = {
  title?: unknown;
  description?: unknown;
  ideaType?: unknown;
  workflowStatus?: unknown;
  niche?: unknown;
  targetKeyword?: unknown;
  priority?: unknown;
  clusterId?: unknown;
  linkedEbookProjectId?: unknown;
  linkedArticleId?: unknown;
  metadata?: unknown;
  sortOrder?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTopicBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const ideaTypeRaw =
      typeof body.ideaType === "string" ? body.ideaType.trim() : "article_idea";
    const ideaType = isPlannerIdeaType(ideaTypeRaw) ? ideaTypeRaw : "article_idea";

    const workflowRaw =
      typeof body.workflowStatus === "string"
        ? body.workflowStatus.trim()
        : "idea";
    const workflowStatus = isPlannerWorkflowStatus(workflowRaw)
      ? workflowRaw
      : "idea";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("content_topics")
      .insert({
        title,
        description:
          typeof body.description === "string" ? body.description.trim() : "",
        idea_type: ideaType,
        workflow_status: workflowStatus,
        niche: typeof body.niche === "string" ? body.niche.trim() : "",
        target_keyword:
          typeof body.targetKeyword === "string" ? body.targetKeyword.trim() : "",
        priority:
          typeof body.priority === "number" ? Math.round(body.priority) : 0,
        cluster_id:
          typeof body.clusterId === "string" && body.clusterId
            ? body.clusterId
            : null,
        linked_ebook_project_id:
          typeof body.linkedEbookProjectId === "string" && body.linkedEbookProjectId
            ? body.linkedEbookProjectId
            : null,
        linked_article_id:
          typeof body.linkedArticleId === "string" && body.linkedArticleId
            ? body.linkedArticleId
            : null,
        metadata:
          body.metadata && typeof body.metadata === "object"
            ? body.metadata
            : {},
        sort_order:
          typeof body.sortOrder === "number" ? Math.round(body.sortOrder) : 0,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create topic." },
        { status: 500 },
      );
    }

    return NextResponse.json({ topic: mapTopicRow(data) });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
