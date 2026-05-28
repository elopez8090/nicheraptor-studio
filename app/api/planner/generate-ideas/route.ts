import { NextResponse } from "next/server";

import {
  generateTopicIdeas,
  type GeneratedTopicIdea,
} from "@/lib/ai/generators/content-planner";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { buildContentInventory } from "@/lib/planner/build-content-inventory";
import {
  ideaTypeForGenerationMode,
  isPlannerWorkflowStatus,
  TOPIC_GENERATION_MODES,
  type TopicGenerationMode,
} from "@/lib/planner/constants";
import { mapTopicRow } from "@/lib/planner/map-rows";
import { createClient } from "@/lib/supabase/server";

function isTopicGenerationMode(value: string): value is TopicGenerationMode {
  return (TOPIC_GENERATION_MODES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  try {
    const apiKey = requireOpenAiApiKey();
    const body = (await request.json()) as Record<string, unknown>;
    const niche = typeof body.niche === "string" ? body.niche.trim() : "";
    if (!niche) {
      return NextResponse.json({ error: "Niche is required." }, { status: 400 });
    }

    const modeRaw = typeof body.mode === "string" ? body.mode.trim() : "article_ideas";
    const mode = isTopicGenerationMode(modeRaw) ? modeRaw : "article_ideas";
    const saveToPlanner = body.saveToPlanner === true;
    const count =
      typeof body.count === "number" ? Math.round(body.count) : undefined;

    const inventory = await buildContentInventory();
    const result = await generateTopicIdeas({
      apiKey,
      niche,
      audience: typeof body.audience === "string" ? body.audience : undefined,
      goal: typeof body.goal === "string" ? body.goal : undefined,
      mode,
      count,
      inventory,
    });

    const ideas = Array.isArray(result.content.ideas)
      ? result.content.ideas
      : [];

    let savedTopics: ReturnType<typeof mapTopicRow>[] = [];
    if (saveToPlanner && ideas.length > 0) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
      }

      const ideaType = ideaTypeForGenerationMode(mode);
      const rows = ideas.map((idea: GeneratedTopicIdea, index: number) => {
        const statusRaw = idea.suggestedWorkflowStatus ?? "idea";
        const workflowStatus = isPlannerWorkflowStatus(statusRaw)
          ? statusRaw
          : "idea";
        return {
          title: idea.title?.trim() || "Untitled idea",
          description: idea.description?.trim() ?? "",
          idea_type: ideaType,
          workflow_status: workflowStatus,
          niche: idea.niche?.trim() || niche,
          target_keyword: idea.targetKeyword?.trim() ?? "",
          metadata: { rationale: idea.rationale ?? "", generated: true },
          sort_order: index,
        };
      });

      const { data, error } = await supabase
        .from("content_topics")
        .insert(rows)
        .select("*");

      if (error) {
        return NextResponse.json(
          { error: error.message, ideas, meta: result.meta },
          { status: 500 },
        );
      }
      savedTopics = (data ?? []).map(mapTopicRow);
    }

    return NextResponse.json({
      ideas,
      savedTopics,
      meta: result.meta,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate ideas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
