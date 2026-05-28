import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { buildUserMessageWithInstruction } from "@/lib/ai/engine/prompt-builder";
import {
  buildGenerateLandingPagePrompt,
  getLandingPageAiInstruction,
  LANDING_PAGE_AI_SYSTEM,
  type LandingPageAiToolId,
  type LandingPageContext,
} from "@/lib/landing-pages/landing-page-ai-prompts";

export async function generateLandingPage(
  apiKey: string,
  ctx: LandingPageContext,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("article_full");
  return generateText({
    apiKey,
    system: LANDING_PAGE_AI_SYSTEM,
    user: buildGenerateLandingPagePrompt(ctx),
    settings: {
      ...preset,
      operation: "landing_page_generate",
    },
  });
}

export async function runLandingPageAiTool(
  apiKey: string,
  tool: LandingPageAiToolId,
  ctx: LandingPageContext,
  body: string,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("article_tool");
  const instruction = getLandingPageAiInstruction(tool, ctx);
  return generateText({
    apiKey,
    system: LANDING_PAGE_AI_SYSTEM,
    user: buildUserMessageWithInstruction(instruction, body),
    settings: {
      ...preset,
      maxTokens: tool === "seo_description" ? 256 : preset.maxTokens,
      operation: `landing_page_tool_${tool}`,
    },
  });
}
