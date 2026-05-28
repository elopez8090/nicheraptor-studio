export type {
  AiProviderId,
  AiGenerationResult,
  GenerationSettings,
  GenerationMeta,
  GenerationTaskId,
  TokenUsage,
} from "@/lib/ai/engine/types";

export {
  generateText,
  generateJson,
  createChatCompletion,
  type ChatCompletionResult,
} from "@/lib/ai/engine/client";

export {
  DEFAULT_CHAT_MODEL,
  getAiQualityConfig,
  isAiQualityTier,
  AI_QUALITY_TIERS,
  estimateEbookGenerationCostUsd,
  type AiQualityTier,
  type AiQualityConfig,
} from "@/lib/ai/engine/quality-settings";

export { getModelPreset } from "@/lib/ai/engine/model-presets";
export {
  JSON_ONLY_SYSTEM_PROMPT,
  buildUserMessageWithInstruction,
  buildLayeredPromptText,
} from "@/lib/ai/engine/prompt-builder";

export { requireOpenAiApiKey, getOpenAiApiKeyFromEnv } from "@/lib/ai/utilities/api-key";
export * from "@/lib/ai/generators";
