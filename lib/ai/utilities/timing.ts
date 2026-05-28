import type { GenerationTiming } from "@/lib/ai/engine/types";

export function startGenerationTimer(): number {
  return Date.now();
}

export function finishGenerationTimer(startedAt: number): GenerationTiming {
  const finishedAt = Date.now();
  return {
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
  };
}
