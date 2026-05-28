import type { SupabaseClient } from "@supabase/supabase-js";

import {
  formatLibrarySnippetsBlock,
  formatProjectMemoryBlock,
} from "@/lib/ai-memory/format-memory-for-prompt";
import { fetchFavoriteLibrarySnippets } from "@/lib/ai-memory/library-snippets";
import {
  fetchArticleProjectMemory,
  upsertArticleProjectMemory,
} from "@/lib/ai-memory/project-memory-db";
import type { ArticleContext } from "@/lib/articles/article-ai-prompts";

export type ArticleGenerationMemory = {
  memoryPromptBlock?: string;
  librarySnippetsBlock?: string;
  seoMemoryBlock?: string;
};

export async function buildArticleGenerationMemory(input: {
  supabase: SupabaseClient;
  userId: string;
  articleId: string;
  ctx: ArticleContext;
}): Promise<ArticleGenerationMemory> {
  await upsertArticleProjectMemory(input.supabase, {
    userId: input.userId,
    articleId: input.articleId,
    memoryPatch: {
      targetAudience: input.ctx.audience,
      tone: input.ctx.tone,
      recurringConcepts: input.ctx.topic ? [input.ctx.topic] : undefined,
      terminology: input.ctx.targetKeyword
        ? [{ term: input.ctx.targetKeyword }]
        : undefined,
    },
  });

  const [memory, snippets] = await Promise.all([
    fetchArticleProjectMemory(input.supabase, input.articleId),
    fetchFavoriteLibrarySnippets(input.supabase, input.userId, 3),
  ]);

  const seoMemoryBlock = [
    `Primary keyword: ${input.ctx.targetKeyword}`,
    input.ctx.secondaryKeywords.length
      ? `Secondary: ${input.ctx.secondaryKeywords.join(", ")}`
      : null,
    input.ctx.wordCountTarget
      ? `Word target: ${input.ctx.wordCountTarget}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    memoryPromptBlock: formatProjectMemoryBlock(memory),
    librarySnippetsBlock: formatLibrarySnippetsBlock(snippets),
    seoMemoryBlock: seoMemoryBlock || undefined,
  };
}

export function mergeArticleMemoryIntoPrompt(
  basePrompt: string,
  memory: ArticleGenerationMemory,
): string {
  const blocks = [
    memory.memoryPromptBlock,
    memory.seoMemoryBlock ? `SEO targets:\n${memory.seoMemoryBlock}` : undefined,
    memory.librarySnippetsBlock,
  ].filter(Boolean);

  if (!blocks.length) {
    return basePrompt;
  }

  return `${blocks.join("\n\n")}\n\n${basePrompt}`;
}
