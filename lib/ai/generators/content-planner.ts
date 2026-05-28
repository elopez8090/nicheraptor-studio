import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateJson } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { JSON_ONLY_SYSTEM_PROMPT } from "@/lib/ai/engine/prompt-builder";
import type { TopicGenerationMode } from "@/lib/planner/constants";
import { TOPIC_GENERATION_MODE_LABELS } from "@/lib/planner/constants";
import { formatInventoryForPrompt } from "@/lib/planner/build-content-inventory";
import type { ContentInventoryItem } from "@/lib/planner/types";

export type GeneratedTopicIdea = {
  title: string;
  description: string;
  targetKeyword: string;
  niche: string;
  rationale: string;
  suggestedWorkflowStatus?: string;
};

export type TopicIdeasPayload = {
  ideas: GeneratedTopicIdea[];
};

export type StrategicSuggestion = {
  category:
    | "ebook_idea"
    | "content_gap"
    | "supporting_article"
    | "article_series"
    | "newsletter"
    | "seo_authority"
    | "cannibalization_risk"
    | "expansion";
  title: string;
  summary: string;
  priority: "low" | "medium" | "high";
  relatedTitles?: string[];
};

export type StrategicSuggestionsPayload = {
  suggestions: StrategicSuggestion[];
  overlapNotes?: string[];
};

export type GenerateTopicIdeasInput = {
  apiKey: string;
  niche: string;
  audience?: string;
  goal?: string;
  mode: TopicGenerationMode;
  count?: number;
  inventory: ContentInventoryItem[];
};

export type GenerateStrategicSuggestionsInput = {
  apiKey: string;
  focusNiche: string;
  focusTopic?: string;
  inventory: ContentInventoryItem[];
};

export async function generateTopicIdeas(
  input: GenerateTopicIdeasInput,
): Promise<AiGenerationResult<TopicIdeasPayload>> {
  const preset = getModelPreset("content_planner");
  const count = Math.min(Math.max(input.count ?? 8, 3), 15);
  const modeLabel = TOPIC_GENERATION_MODE_LABELS[input.mode];
  const inventoryBlock = formatInventoryForPrompt(input.inventory);

  const user = `You are a personal content strategist for a solo creator.

Generate ${count} ${modeLabel} for this niche and audience.

Niche: ${input.niche.trim()}
Audience: ${input.audience?.trim() || "General audience in this niche"}
Goal: ${input.goal?.trim() || "Build topical authority and a cohesive content ecosystem"}

EXISTING CONTENT (avoid duplicates and note expansion opportunities):
${inventoryBlock}

Rules:
- Do not repeat titles or angles already covered above.
- Flag subtle overlaps in rationale when relevant.
- Titles should be specific and actionable.
- Include a realistic target keyword when SEO applies.

Return JSON:
{
  "ideas": [
    {
      "title": string,
      "description": string,
      "targetKeyword": string,
      "niche": string,
      "rationale": string,
      "suggestedWorkflowStatus": "idea" | "researching" | optional
    }
  ]
}`;

  return generateJson<TopicIdeasPayload>({
    apiKey: input.apiKey,
    system: JSON_ONLY_SYSTEM_PROMPT,
    user,
    settings: {
      ...preset,
      operation: "content_planner_topic_ideas",
    },
  });
}

export async function generateStrategicSuggestions(
  input: GenerateStrategicSuggestionsInput,
): Promise<AiGenerationResult<StrategicSuggestionsPayload>> {
  const preset = getModelPreset("content_planner_strategy");
  const inventoryBlock = formatInventoryForPrompt(input.inventory);

  const user = `You are a personal content strategist analyzing an existing library.

Focus niche: ${input.focusNiche.trim()}
${input.focusTopic?.trim() ? `Focus topic: ${input.focusTopic.trim()}` : ""}

EXISTING CONTENT:
${inventoryBlock}

Produce strategic suggestions across:
- related ebook ideas
- missing content gaps
- supporting article ideas
- article series (grouped angles)
- newsletter expansions
- SEO topical authority moves
- content cannibalization risks (keyword/topic overlap)
- opportunities to expand existing assets

Return JSON:
{
  "suggestions": [
    {
      "category": "ebook_idea" | "content_gap" | "supporting_article" | "article_series" | "newsletter" | "seo_authority" | "cannibalization_risk" | "expansion",
      "title": string,
      "summary": string,
      "priority": "low" | "medium" | "high",
      "relatedTitles": string[] optional
    }
  ],
  "overlapNotes": string[] optional — short notes on overlapping topics/keywords
}`;

  return generateJson<StrategicSuggestionsPayload>({
    apiKey: input.apiKey,
    system: JSON_ONLY_SYSTEM_PROMPT,
    user,
    settings: {
      ...preset,
      operation: "content_planner_strategy",
    },
  });
}
