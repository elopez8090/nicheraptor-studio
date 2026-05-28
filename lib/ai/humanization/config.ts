export const HUMAN_SCORE_OPTIONS = [
  { value: "balanced-ai", label: "Balanced AI" },
  { value: "humanized", label: "Humanized" },
  { value: "highly-human", label: "Highly Human" },
  { value: "aggressive-humanization", label: "Aggressive Humanization" },
] as const;

export type HumanScore = (typeof HUMAN_SCORE_OPTIONS)[number]["value"];

export type HumanizationOptions = {
  storytellingExamples: boolean;
  analogies: boolean;
  personalStyleCommentary: boolean;
  contrarianTakes: boolean;
  humorLightPersonality: boolean;
};

export type ResolvedHumanizationConfig = {
  score: HumanScore;
  options: HumanizationOptions;
};

const DEFAULT_OPTIONS_BY_SCORE: Record<HumanScore, HumanizationOptions> = {
  "balanced-ai": {
    storytellingExamples: false,
    analogies: false,
    personalStyleCommentary: false,
    contrarianTakes: false,
    humorLightPersonality: false,
  },
  humanized: {
    storytellingExamples: true,
    analogies: true,
    personalStyleCommentary: false,
    contrarianTakes: false,
    humorLightPersonality: false,
  },
  "highly-human": {
    storytellingExamples: true,
    analogies: true,
    personalStyleCommentary: true,
    contrarianTakes: true,
    humorLightPersonality: true,
  },
  "aggressive-humanization": {
    storytellingExamples: true,
    analogies: true,
    personalStyleCommentary: true,
    contrarianTakes: true,
    humorLightPersonality: true,
  },
};

export function isHumanScore(value: unknown): value is HumanScore {
  return HUMAN_SCORE_OPTIONS.some((option) => option.value === value);
}

export function normalizeHumanScore(
  value: unknown,
  fallback: HumanScore = "humanized",
): HumanScore {
  return isHumanScore(value) ? value : fallback;
}

function toBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function resolveHumanizationConfig(input?: {
  score?: unknown;
  options?: Partial<HumanizationOptions> | null;
}): ResolvedHumanizationConfig {
  const score = normalizeHumanScore(input?.score);
  const defaults = DEFAULT_OPTIONS_BY_SCORE[score];
  const options = input?.options ?? {};
  return {
    score,
    options: {
      storytellingExamples:
        toBooleanOrUndefined(options.storytellingExamples) ??
        defaults.storytellingExamples,
      analogies: toBooleanOrUndefined(options.analogies) ?? defaults.analogies,
      personalStyleCommentary:
        toBooleanOrUndefined(options.personalStyleCommentary) ??
        defaults.personalStyleCommentary,
      contrarianTakes:
        toBooleanOrUndefined(options.contrarianTakes) ?? defaults.contrarianTakes,
      humorLightPersonality:
        toBooleanOrUndefined(options.humorLightPersonality) ??
        defaults.humorLightPersonality,
    },
  };
}
