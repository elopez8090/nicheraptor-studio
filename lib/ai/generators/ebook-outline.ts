import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText, generateJson } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { JSON_ONLY_SYSTEM_PROMPT } from "@/lib/ai/engine/prompt-builder";
import { buildOutlineGenerationPrompt } from "@/lib/ai/prompts/outline-generation-layers";
import type { HumanizationOptions, HumanScore } from "@/lib/ai/humanization/config";
import type { WritingStyle } from "@/lib/ai/styles/writing-styles";
import type { EbookOutlinePayload } from "@/lib/ai/utilities/validation";
import { validateEbookOutlinePayload } from "@/lib/ai/utilities/validation";

export type GenerateEbookOutlineInput = {
  apiKey: string;
  topic: string;
  audience: string;
  goal: string;
  writingStyle: WritingStyle;
  humanScore: HumanScore;
  humanizationOptions?: Partial<HumanizationOptions> | null;
  chapterLines: string[];
  lengthLines: string[];
};

export async function generateEbookOutline(
  input: GenerateEbookOutlineInput,
): Promise<AiGenerationResult<EbookOutlinePayload>> {
  const preset = getModelPreset("ebook_outline");
  const user = buildOutlineGenerationPrompt({
    topic: input.topic,
    audience: input.audience,
    goal: input.goal,
    writingStyle: input.writingStyle,
    humanScore: input.humanScore,
    humanizationOptions: input.humanizationOptions,
    chapterLines: input.chapterLines,
    lengthLines: input.lengthLines,
  });

  const result = await generateJson<EbookOutlinePayload>({
    apiKey: input.apiKey,
    system: JSON_ONLY_SYSTEM_PROMPT,
    user,
    settings: {
      ...preset,
      operation: "ebook_outline",
    },
  });

  if (!validateEbookOutlinePayload(result.content)) {
    throw new Error("OpenAI returned an outline in an unexpected format.");
  }

  return result;
}

export type GenerateTitleIdeasInput = {
  apiKey: string;
  topic: string;
  audience?: string;
  goal?: string;
};

export async function generateEbookTitleIdeas(
  input: GenerateTitleIdeasInput,
): Promise<AiGenerationResult<{ titles: string[] }>> {
  const audienceLine =
    input.audience?.trim() || "general readers";
  const goalLine =
    input.goal?.trim() || "help the reader achieve a clear outcome";
  const preset = getModelPreset("ebook_title_ideas");

  const user = `You are an expert ebook marketer and content strategist.

Topic: ${input.topic.trim()}
Audience: ${audienceLine}
Goal: ${goalLine}

Suggest 5 distinct, compelling ebook title ideas. Each should be specific, benefit-driven, and under 12 words.

Respond with ONLY valid JSON:
{
  "titles": [string, string, string, string, string]
}`;

  return generateJson<{ titles: string[] }>({
    apiKey: input.apiKey,
    system: JSON_ONLY_SYSTEM_PROMPT,
    user,
    settings: {
      ...preset,
      operation: "ebook_title_ideas",
    },
  });
}
