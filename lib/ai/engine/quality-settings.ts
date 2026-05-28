export type AiQualityTier = "fast" | "balanced" | "premium";

export type AiQualityConfig = {
  tier: AiQualityTier;
  label: string;
  description: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
  estimatedInputTokensPerChapter: number;
  estimatedOutputTokensPerChapter: number;
};

const QUALITY_CONFIGS: Record<AiQualityTier, AiQualityConfig> = {
  fast: {
    tier: "fast",
    label: "Fast",
    description: "Shorter drafts, quicker turnaround.",
    model: "gpt-4.1-mini",
    temperature: 0.65,
    maxOutputTokens: 2_400,
    estimatedInputTokensPerChapter: 750,
    estimatedOutputTokensPerChapter: 1_400,
  },
  balanced: {
    tier: "balanced",
    label: "Balanced",
    description: "Default depth and pacing for most ebooks.",
    model: "gpt-4.1-mini",
    temperature: 0.72,
    maxOutputTokens: 3_600,
    estimatedInputTokensPerChapter: 900,
    estimatedOutputTokensPerChapter: 2_200,
  },
  premium: {
    tier: "premium",
    label: "Premium",
    description: "Richer prose and longer chapters (higher cost).",
    model: "gpt-4.1",
    temperature: 0.75,
    maxOutputTokens: 4_500,
    estimatedInputTokensPerChapter: 1_100,
    estimatedOutputTokensPerChapter: 3_000,
  },
};

export const AI_QUALITY_TIERS: AiQualityTier[] = ["fast", "balanced", "premium"];

export const DEFAULT_CHAT_MODEL = "gpt-4.1-mini";

export function isAiQualityTier(value: unknown): value is AiQualityTier {
  return value === "fast" || value === "balanced" || value === "premium";
}

export function getAiQualityConfig(tier: AiQualityTier): AiQualityConfig {
  return QUALITY_CONFIGS[tier];
}

/** Illustrative USD estimate (not billing-accurate). */
export function estimateEbookGenerationCostUsd(
  chapterCount: number,
  tier: AiQualityTier,
): { totalTokens: number; estimatedUsd: number } {
  const config = getAiQualityConfig(tier);
  const input = chapterCount * config.estimatedInputTokensPerChapter;
  const output = chapterCount * config.estimatedOutputTokensPerChapter;
  const totalTokens = input + output;

  const isPremiumModel =
    config.model.includes("4.1") && !config.model.includes("mini");
  const inputRatePerM = isPremiumModel ? 2.0 : 0.4;
  const outputRatePerM = isPremiumModel ? 8.0 : 1.6;
  const estimatedUsd =
    (input / 1_000_000) * inputRatePerM +
    (output / 1_000_000) * outputRatePerM;

  return {
    totalTokens,
    estimatedUsd: Math.round(estimatedUsd * 100) / 100,
  };
}
