import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import { buildUserMessageWithInstruction } from "@/lib/ai/engine/prompt-builder";
import {
  getAiRewriteInstruction,
  type AiRewriteToolId,
} from "@/lib/ebooks/ai-rewrite-tools";

const EBOOK_REWRITE_SYSTEM =
  "You are an expert nonfiction ebook editor. Follow the user's instruction exactly. Output only the revised passage with no quotes, labels, markdown fences, or commentary.";

export type RewriteContentInput = {
  apiKey: string;
  instruction: string;
  text: string;
  /** Ebook editor tools vs custom instruction */
  source?: "ebook" | "custom";
  temperature?: number;
};

export async function rewriteContent(
  input: RewriteContentInput,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("rewrite");
  const system =
    input.source === "custom"
      ? "You are an expert editor. Follow the instruction exactly. Output only the revised text with no commentary."
      : EBOOK_REWRITE_SYSTEM;

  return generateText({
    apiKey: input.apiKey,
    system,
    user: buildUserMessageWithInstruction(input.instruction, input.text),
    settings: {
      ...preset,
      temperature: input.temperature ?? preset.temperature,
      operation: "rewrite_content",
    },
  });
}

export async function rewriteEbookSelection(
  apiKey: string,
  tool: AiRewriteToolId,
  text: string,
): Promise<AiGenerationResult<string>> {
  const instruction = getAiRewriteInstruction(tool);
  return rewriteContent({
    apiKey,
    instruction,
    text,
    source: "ebook",
  });
}
