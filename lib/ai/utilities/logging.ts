import type { GenerationMeta } from "@/lib/ai/engine/types";

const DEBUG_PROMPTS =
  process.env.AI_DEBUG_PROMPTS === "1" ||
  process.env.AI_DEBUG_PROMPTS === "true";

export function logGeneration(meta: GenerationMeta): void {
  const usage = meta.usage
    ? ` tokens=${meta.usage.totalTokens} (${meta.usage.promptTokens}+${meta.usage.completionTokens})`
    : "";
  console.info(
    `[ai] ${meta.operation} provider=${meta.provider} model=${meta.model} ${meta.timing.durationMs}ms${usage}`,
  );
}

export function debugPrompt(
  operation: string,
  parts: { system?: string; user: string },
): void {
  if (!DEBUG_PROMPTS) {
    return;
  }
  const systemPreview = parts.system
    ? parts.system.slice(0, 400)
    : "(none)";
  const userPreview = parts.user.slice(0, 1200);
  console.debug(
    `[ai:debug] ${operation}\n--- system ---\n${systemPreview}\n--- user ---\n${userPreview}`,
  );
}
