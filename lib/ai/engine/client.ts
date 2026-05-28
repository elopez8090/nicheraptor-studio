import type {
  AiGenerationResult,
  AiProviderId,
  ChatMessage,
  GenerationSettings,
  TokenUsage,
} from "@/lib/ai/engine/types";
import { debugPrompt, logGeneration } from "@/lib/ai/utilities/logging";
import {
  finishGenerationTimer,
  startGenerationTimer,
} from "@/lib/ai/utilities/timing";
import { withRetry } from "@/lib/ai/utilities/retry";
import { parseJsonFromModelContent } from "@/lib/ai/utilities/content";

export type OpenAiChatCompletionOptions = {
  apiKey: string;
  messages: ChatMessage[];
  model: string;
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
};

export type OpenAiRawCompletion = {
  content: string;
  usage?: TokenUsage;
};

export async function openAiChatCompletion(
  options: OpenAiChatCompletionOptions,
): Promise<OpenAiRawCompletion> {
  const body: Record<string, unknown> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  };
  if (options.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      errorText || `OpenAI request failed with status ${response.status}`,
    );
  }

  const completion = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };

  const content = completion?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI response did not include any content.");
  }

  const usage = completion.usage;
  return {
    content,
    usage: usage
      ? {
          promptTokens: usage.prompt_tokens ?? 0,
          completionTokens: usage.completion_tokens ?? 0,
          totalTokens: usage.total_tokens ?? 0,
        }
      : undefined,
  };
}

export type GenerateTextInput = {
  apiKey: string;
  system: string;
  user: string;
  settings: GenerationSettings;
};

export async function generateText(
  input: GenerateTextInput,
): Promise<AiGenerationResult<string>> {
  const provider: AiProviderId = input.settings.provider ?? "openai";
  if (provider !== "openai") {
    throw new Error(`Provider "${provider}" is not implemented yet.`);
  }

  debugPrompt(input.settings.operation, {
    system: input.system,
    user: input.user,
  });

  const startedAt = startGenerationTimer();
  const maxAttempts = input.settings.maxAttempts ?? 2;

  const { content, usage } = await withRetry(
    () =>
      openAiChatCompletion({
        apiKey: input.apiKey,
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
        model: input.settings.model,
        temperature: input.settings.temperature,
        maxTokens: input.settings.maxTokens,
        jsonMode: input.settings.jsonMode,
      }),
    { maxAttempts },
  );

  const meta = {
    provider,
    model: input.settings.model,
    operation: input.settings.operation,
    timing: finishGenerationTimer(startedAt),
    usage,
  };
  logGeneration(meta);

  return { content, usage, meta };
}

export async function generateJson<T>(
  input: GenerateTextInput,
): Promise<AiGenerationResult<T>> {
  const result = await generateText({
    ...input,
    settings: { ...input.settings, jsonMode: true },
  });
  const parsed = parseJsonFromModelContent<T>(result.content);
  return { ...result, content: parsed };
}

/** @deprecated Prefer generateText — kept for incremental migration. */
export type ChatCompletionResult = {
  content: string;
  usage?: TokenUsage;
};

/** @deprecated Use generateText from the AI engine. */
export async function createChatCompletion(options: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
}): Promise<ChatCompletionResult> {
  const result = await generateText({
    apiKey: options.apiKey,
    system: options.system,
    user: options.user,
    settings: {
      model: options.model,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      operation: "legacy_chat_completion",
      maxAttempts: 1,
    },
  });
  return { content: result.content, usage: result.usage };
}
