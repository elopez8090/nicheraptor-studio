/** Supported providers (OpenAI implemented; others reserved for future use). */
export type AiProviderId = "openai" | "anthropic" | "google" | "local";

export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type GenerationTiming = {
  startedAt: number;
  finishedAt: number;
  durationMs: number;
};

export type GenerationMeta = {
  provider: AiProviderId;
  model: string;
  operation: string;
  timing: GenerationTiming;
  usage?: TokenUsage;
};

export type AiGenerationResult<TContent = string> = {
  content: TContent;
  usage?: TokenUsage;
  meta: GenerationMeta;
};

export type ChatRole = "system" | "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type GenerationSettings = {
  provider?: AiProviderId;
  model: string;
  temperature: number;
  maxTokens: number;
  /** OpenAI JSON mode */
  jsonMode?: boolean;
  /** Logical name for logs and meta */
  operation: string;
  /** Retry transient failures */
  maxAttempts?: number;
};

export type GenerationTaskId =
  | "ebook_outline"
  | "ebook_chapter"
  | "ebook_title_ideas"
  | "article_outline"
  | "article_full"
  | "article_tool"
  | "rewrite"
  | "research"
  | "seo"
  | "chapter_summary"
  | "content_planner"
  | "content_planner_strategy"
  | "content_repurpose";
