import { NextResponse } from "next/server";

import { mapClusterRow } from "@/lib/planner/map-rows";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPlannerSnapshot();
  return NextResponse.json({ clusters: snapshot.clusters });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("content_clusters")
    .insert({
      name,
      description:
        typeof body.description === "string" ? body.description.trim() : "",
      pillar_topic_id:
        typeof body.pillarTopicId === "string" && body.pillarTopicId
          ? body.pillarTopicId
          : null,
      color: typeof body.color === "string" ? body.color.trim() : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create cluster." },
      { status: 500 },
    );
  }

  return NextResponse.json({ cluster: mapClusterRow(data) });
}
