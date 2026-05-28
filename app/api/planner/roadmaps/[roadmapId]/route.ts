import { NextResponse } from "next/server";

import { ROADMAP_STATUSES } from "@/lib/planner/constants";
import { mapRoadmapRow } from "@/lib/planner/map-rows";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ roadmapId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { roadmapId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") patch.title = body.title.trim();
  if (typeof body.description === "string") {
    patch.description = body.description.trim();
  }
  if (typeof body.goal === "string") patch.goal = body.goal.trim();
  if (body.targetDate === null) patch.target_date = null;
  if (typeof body.targetDate === "string") {
    patch.target_date = body.targetDate || null;
  }
  if (
    typeof body.status === "string" &&
    (ROADMAP_STATUSES as readonly string[]).includes(body.status)
  ) {
    patch.status = body.status;
  }
  if (Array.isArray(body.items)) {
    patch.items = body.items;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("publishing_roadmaps")
    .update(patch)
    .eq("id", roadmapId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ roadmap: mapRoadmapRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { roadmapId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("publishing_roadmaps")
    .delete()
    .eq("id", roadmapId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
