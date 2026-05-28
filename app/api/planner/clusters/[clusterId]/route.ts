import { NextResponse } from "next/server";

import { mapClusterRow } from "@/lib/planner/map-rows";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ clusterId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { clusterId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.description === "string") {
    patch.description = body.description.trim();
  }
  if (body.pillarTopicId === null) patch.pillar_topic_id = null;
  if (typeof body.pillarTopicId === "string") {
    patch.pillar_topic_id = body.pillarTopicId || null;
  }
  if (typeof body.color === "string") patch.color = body.color.trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("content_clusters")
    .update(patch)
    .eq("id", clusterId)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Update failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ cluster: mapClusterRow(data) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { clusterId } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("content_clusters")
    .delete()
    .eq("id", clusterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
