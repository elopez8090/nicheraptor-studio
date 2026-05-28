import type { GenerationTaskId } from "@/lib/ai/engine/types";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/engine/quality-settings";

export type ModelPreset = {
  model: string;
  temperature: number;
  maxTokens: number;
  jsonMode?: boolean;
};

const PRESETS: Record<GenerationTaskId, ModelPreset> = {
  ebook_outline: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
    jsonMode: true,
  },
  ebook_chapter: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.72,
    maxTokens: 3600,
  },
  ebook_title_ideas: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.85,
    maxTokens: 1024,
    jsonMode: true,
  },
  article_outline: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
  },
  article_full: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.65,
    maxTokens: 8192,
  },
  article_tool: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.65,
    maxTokens: 2048,
  },
  rewrite: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.6,
    maxTokens: 4096,
  },
  research: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.4,
    maxTokens: 2800,
    jsonMode: true,
  },
  seo: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.5,
    maxTokens: 512,
  },
  chapter_summary: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.2,
    maxTokens: 600,
    jsonMode: true,
  },
  content_planner: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.75,
    maxTokens: 4096,
    jsonMode: true,
  },
  content_planner_strategy: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.7,
    maxTokens: 4096,
    jsonMode: true,
  },
  content_repurpose: {
    model: DEFAULT_CHAT_MODEL,
    temperature: 0.72,
    maxTokens: 4096,
  },
};

export function getModelPreset(task: GenerationTaskId): ModelPreset {
  return { ...PRESETS[task] };
}
