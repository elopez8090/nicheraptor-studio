import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import type { ArticleGenerationMemory } from "@/lib/context-engine/build-article-context";
import { mergeArticleMemoryIntoPrompt } from "@/lib/context-engine/build-article-context";
import {
  ARTICLE_AI_SYSTEM,
  buildFullArticleUserPrompt,
  buildOutlineUserPrompt,
  type ArticleContext,
} from "@/lib/articles/article-ai-prompts";
import { estimateMaxTokensForWordTarget } from "@/lib/ai/utilities/tokens";

export async function generateArticleOutline(
  apiKey: string,
  ctx: ArticleContext,
  memory?: ArticleGenerationMemory,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("article_outline");
  const user = mergeArticleMemoryIntoPrompt(
    buildOutlineUserPrompt(ctx),
    memory ?? {},
  );
  return generateText({
    apiKey,
    system: ARTICLE_AI_SYSTEM,
    user,
    settings: {
      ...preset,
      operation: "article_outline",
    },
  });
}

export async function generateArticle(
  apiKey: string,
  ctx: ArticleContext,
  outlineHtml?: string,
  memory?: ArticleGenerationMemory,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("article_full");
  const maxTokens = ctx.wordCountTarget
    ? estimateMaxTokensForWordTarget(ctx.wordCountTarget)
    : preset.maxTokens;

  const user = mergeArticleMemoryIntoPrompt(
    buildFullArticleUserPrompt(ctx, outlineHtml),
    memory ?? {},
  );

  return generateText({
    apiKey,
    system: ARTICLE_AI_SYSTEM,
    user,
    settings: {
      ...preset,
      maxTokens,
      operation: "article_full",
    },
  });
}
