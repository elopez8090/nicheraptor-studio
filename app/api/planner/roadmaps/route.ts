import { NextResponse } from "next/server";

import { isPlannerWorkflowStatus, ROADMAP_STATUSES } from "@/lib/planner/constants";
import { mapRoadmapRow } from "@/lib/planner/map-rows";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";
import type { RoadmapItem } from "@/lib/planner/types";
import { createClient } from "@/lib/supabase/server";

function parseItems(raw: unknown): RoadmapItem[] {
  if (!Array.isArray(raw)) return [];
  const items: RoadmapItem[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const o = entry as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!title) return;
    const workflow =
      typeof o.workflowStatus === "string" ? o.workflowStatus : undefined;
    const item: RoadmapItem = {
      id:
        typeof o.id === "string" && o.id.trim()
          ? o.id.trim()
          : `item-${index}`,
      title,
      sortOrder:
        typeof o.sortOrder === "number" ? Math.round(o.sortOrder) : index,
    };
    if (typeof o.topicId === "string") item.topicId = o.topicId;
    if (workflow && isPlannerWorkflowStatus(workflow)) {
      item.workflowStatus = workflow;
    }
    if (typeof o.notes === "string") item.notes = o.notes;
    items.push(item);
  });
  return items;
}

export async function GET() {
  const snapshot = await fetchPlannerSnapshot();
  return NextResponse.json({ roadmaps: snapshot.roadmaps });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const statusRaw = typeof body.status === "string" ? body.status : "draft";
  const status = (ROADMAP_STATUSES as readonly string[]).includes(statusRaw)
    ? statusRaw
    : "draft";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("publishing_roadmaps")
    .insert({
      title,
      description:
        typeof body.description === "string" ? body.description.trim() : "",
      goal: typeof body.goal === "string" ? body.goal.trim() : "",
      target_date:
        typeof body.targetDate === "string" && body.targetDate
          ? body.targetDate
          : null,
      status,
      items: parseItems(body.items),
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create roadmap." },
      { status: 500 },
    );
  }

  return NextResponse.json({ roadmap: mapRoadmapRow(data) });
}
