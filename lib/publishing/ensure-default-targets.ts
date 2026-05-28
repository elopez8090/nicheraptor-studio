import {
  DEFAULT_PLATFORM_LABELS,
  PUBLISHING_PLATFORM_TYPES,
  type PublishingPlatformType,
} from "@/lib/publishing/constants";
import { createClient } from "@/lib/supabase/server";

export async function ensureDefaultPublishingTargets(userId: string): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("publishing_targets")
    .select("platform_type")
    .eq("user_id", userId);

  const have = new Set(
    (existing ?? []).map((row) => String(row.platform_type)),
  );

  const missing = PUBLISHING_PLATFORM_TYPES.filter(
    (platform) => !have.has(platform),
  );

  if (missing.length === 0) {
    return;
  }

  const rows = missing.map((platformType: PublishingPlatformType) => ({
    user_id: userId,
    name: DEFAULT_PLATFORM_LABELS[platformType],
    platform_type: platformType,
    is_enabled: platformType === "markdown_export" || platformType === "html_export",
    config: {
      integrationStatus: "not_configured",
      supportsAutoPost: false,
      supportsScheduledPublish: false,
    },
    metadata: {
      phase: "architecture_ready",
    },
  }));

  await supabase.from("publishing_targets").insert(rows);
}
