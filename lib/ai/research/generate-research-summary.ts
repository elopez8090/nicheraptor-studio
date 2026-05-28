import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { buildResearchUserPrompt } from "@/lib/ai/prompts/research-user";
import { RESEARCH_SYSTEM_PROMPT } from "@/lib/ai/prompts/research-system";
import { parseResearchResponseJson } from "@/lib/research/parse-research-response";
import type { ParsedResearchPayload } from "@/lib/research/parse-research-response";
import type { ResearchPromptContext } from "@/lib/ai/prompts/research-user";

export async function generateResearchSummary(
  apiKey: string,
  context: ResearchPromptContext,
): Promise<AiGenerationResult<ParsedResearchPayload>> {
  const preset = getModelPreset("research");
  const userPrompt = buildResearchUserPrompt(context);

  const result = await generateText({
    apiKey,
    system: RESEARCH_SYSTEM_PROMPT,
    user: userPrompt,
    settings: {
      ...preset,
      operation: `research_${context.action}`,
    },
  });

  const parsed = parseResearchResponseJson(result.content);
  return {
    ...result,
    content: parsed,
  };
}
