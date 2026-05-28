import type { ArticleContext } from "@/lib/articles/article-ai-prompts";
import {
  getArticleAiInstruction,
  type ArticleAiToolId,
} from "@/lib/articles/article-ai-prompts";
import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { ARTICLE_AI_SYSTEM } from "@/lib/articles/article-ai-prompts";
import { buildUserMessageWithInstruction } from "@/lib/ai/engine/prompt-builder";

export type SeoField = "meta_title" | "meta_description" | "slug";

export type GenerateSeoInput = {
  apiKey: string;
  ctx: ArticleContext;
  field: SeoField;
};

export async function generateSEO(
  input: GenerateSeoInput,
): Promise<AiGenerationResult<string>> {
  const tool: ArticleAiToolId =
    input.field === "meta_title"
      ? "meta_title"
      : input.field === "meta_description"
        ? "meta_description"
        : "slug";

  const preset = getModelPreset("seo");
  const instruction = getArticleAiInstruction(tool, input.ctx);

  return generateText({
    apiKey: input.apiKey,
    system: ARTICLE_AI_SYSTEM,
    user: instruction,
    settings: {
      ...preset,
      maxTokens: 256,
      operation: `seo_${input.field}`,
    },
  });
}

export async function generateArticleAiTool(
  apiKey: string,
  tool: ArticleAiToolId,
  ctx: ArticleContext,
  body: string,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("article_tool");
  const instruction = getArticleAiInstruction(tool, ctx);
  const temperature =
    tool === "slug" || tool === "meta_title" ? 0.5 : preset.temperature;
  const maxTokens = tool === "add_faq" ? 4096 : preset.maxTokens;

  return generateText({
    apiKey,
    system: ARTICLE_AI_SYSTEM,
    user: buildUserMessageWithInstruction(instruction, body),
    settings: {
      ...preset,
      temperature,
      maxTokens,
      operation: `article_tool_${tool}`,
    },
  });
}

export function normalizeSeoFieldValue(
  field: SeoField,
  raw: string,
): string {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  if (field === "slug") {
    return trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return trimmed;
}
