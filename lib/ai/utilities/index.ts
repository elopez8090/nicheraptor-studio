export { requireOpenAiApiKey, getOpenAiApiKeyFromEnv } from "@/lib/ai/utilities/api-key";
export { withRetry, type RetryOptions } from "@/lib/ai/utilities/retry";
export {
  estimateTokenCount,
  estimateMaxTokensForWordTarget,
} from "@/lib/ai/utilities/tokens";
export {
  stripMarkdownCodeFences,
  parseJsonFromModelContent,
} from "@/lib/ai/utilities/content";
export {
  validateEbookOutlinePayload,
  validateTitleIdeasPayload,
  type EbookOutlinePayload,
  type EbookOutlineChapter,
} from "@/lib/ai/utilities/validation";
export { logGeneration, debugPrompt } from "@/lib/ai/utilities/logging";
export {
  startGenerationTimer,
  finishGenerationTimer,
} from "@/lib/ai/utilities/timing";
