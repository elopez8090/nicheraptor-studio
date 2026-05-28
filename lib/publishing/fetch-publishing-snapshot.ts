import { ensureDefaultPublishingTargets } from "@/lib/publishing/ensure-default-targets";
import {
  mapContentCalendarRow,
  mapPublishingQueueRow,
  mapPublishingTargetRow,
  mapPublishingTemplateRow,
  mapRepurposingJobRow,
} from "@/lib/publishing/map-rows";
import type { PublishingSnapshot } from "@/lib/publishing/types";
import { createClient } from "@/lib/supabase/server";

const EMPTY: PublishingSnapshot = {
  targets: [],
  queue: [],
  calendar: [],
  templates: [],
  recentJobs: [],
};

export async function fetchPublishingSnapshot(): Promise<PublishingSnapshot> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return EMPTY;
  }

  await ensureDefaultPublishingTargets(user.id);

  const [targetsRes, queueRes, calendarRes, templatesRes, jobsRes] =
    await Promise.all([
      supabase
        .from("publishing_targets")
        .select("*")
        .eq("user_id", user.id)
        .order("platform_type", { ascending: true }),
      supabase
        .from("publishing_queue")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(80),
      supabase
        .from("content_calendar")
        .select("*")
        .eq("user_id", user.id)
        .order("planned_publish_date", { ascending: true, nullsFirst: false })
        .limit(60),
      supabase
        .from("publishing_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(40),
      supabase
        .from("content_repurposing_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  return {
    targets: (targetsRes.data ?? []).map((row) =>
      mapPublishingTargetRow(row as Record<string, unknown>),
    ),
    queue: (queueRes.data ?? []).map((row) =>
      mapPublishingQueueRow(row as Record<string, unknown>),
    ),
    calendar: (calendarRes.data ?? []).map((row) =>
      mapContentCalendarRow(row as Record<string, unknown>),
    ),
    templates: (templatesRes.data ?? []).map((row) =>
      mapPublishingTemplateRow(row as Record<string, unknown>),
    ),
    recentJobs: (jobsRes.data ?? []).map((row) =>
      mapRepurposingJobRow(row as Record<string, unknown>),
    ),
  };
}
