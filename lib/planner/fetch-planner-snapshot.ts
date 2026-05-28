import { createClient } from "@/lib/supabase/server";
import {
  mapClusterRow,
  mapRelationshipRow,
  mapRoadmapRow,
  mapTopicRow,
} from "@/lib/planner/map-rows";
import type { PlannerSnapshot } from "@/lib/planner/types";

const emptySnapshot: PlannerSnapshot = {
  topics: [],
  clusters: [],
  relationships: [],
  roadmaps: [],
};

export async function fetchPlannerSnapshot(): Promise<PlannerSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return emptySnapshot;
  }

  const [topicsRes, clustersRes, relationshipsRes, roadmapsRes] =
    await Promise.all([
      supabase
        .from("content_topics")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false }),
      supabase
        .from("content_clusters")
        .select("*")
        .order("updated_at", { ascending: false }),
      supabase.from("content_relationships").select("*"),
      supabase
        .from("publishing_roadmaps")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

  if (
    topicsRes.error ||
    clustersRes.error ||
    relationshipsRes.error ||
    roadmapsRes.error
  ) {
    return emptySnapshot;
  }

  return {
    topics: (topicsRes.data ?? []).map(mapTopicRow),
    clusters: (clustersRes.data ?? []).map(mapClusterRow),
    relationships: (relationshipsRes.data ?? []).map(mapRelationshipRow),
    roadmaps: (roadmapsRes.data ?? []).map(mapRoadmapRow),
  };
}
