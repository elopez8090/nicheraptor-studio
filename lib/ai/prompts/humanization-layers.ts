import { FORBIDDEN_AI_PHRASES } from "@/lib/ai/phrase-filters";
import {
  type HumanizationOptions,
  type ResolvedHumanizationConfig,
} from "@/lib/ai/humanization/config";
import {
  getWritingStyleLabel,
  getWritingStylePrompt,
  type WritingStyle,
} from "@/lib/ai/styles/writing-styles";

type PromptLayers = {
  systemPrompt: string;
  writingStylePrompt: string;
  voicePrompt: string;
  antiAiPrompt: string;
  chapterContextPrompt: string;
};

function stableHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickVariant(
  seedBase: string,
  variants: readonly string[],
  offset: number,
): string {
  return variants[(stableHash(`${seedBase}:${offset}`) + offset) % variants.length];
}

function buildOptionalFeaturePrompt(options: HumanizationOptions): string {
  const lines: string[] = [];
  if (options.storytellingExamples) {
    lines.push("- Include short storytelling examples where they add clarity.");
  }
  if (options.analogies) {
    lines.push("- Use occasional analogies to simplify abstract ideas.");
  }
  if (options.personalStyleCommentary) {
    lines.push("- Add selective personal-style commentary with a clear point of view.");
  }
  if (options.contrarianTakes) {
    lines.push("- Include occasional contrarian takes when common advice is weak.");
  }
  if (options.humorLightPersonality) {
    lines.push("- Use light personality or restrained humor when it feels natural.");
  }
  return lines.join("\n");
}

export function buildHumanizationLayers(input: {
  writingStyle: WritingStyle;
  humanization: ResolvedHumanizationConfig;
  seedHint: string;
  chapterContextPrompt: string;
}): PromptLayers {
  const paragraphStructures = [
    "alternate between 1 short paragraph and 1 fuller paragraph in each section",
    "mix standalone lines with denser explanatory paragraphs",
    "use a short setup paragraph, then a concrete example paragraph, then takeaway",
  ] as const;
  const headingStyles = [
    "benefit-driven section headers",
    "plain-language section headers",
    "assertive opinion-led section headers",
  ] as const;
  const transitions = [
    "use organic transitions, not formulaic bridge phrases",
    "use sparse transitions and let structure carry momentum",
    "use contrast transitions when shifting ideas",
  ] as const;

  const variabilityPrompt = [
    "- Vary sentence lengths from short punches to longer flowing lines.",
    `- Paragraph structure: ${pickVariant(input.seedHint, paragraphStructures, 1)}.`,
    `- Heading style preference: ${pickVariant(input.seedHint, headingStyles, 2)}.`,
    `- Transition preference: ${pickVariant(input.seedHint, transitions, 3)}.`,
    "- Occasionally use rhetorical questions and short punchy paragraphs.",
    "- Use occasional sentence fragments naturally when they improve rhythm.",
  ].join("\n");

  const antiAiPrompt = `Anti-AI writing constraints:
- Avoid cliche openings and repetitive transitions.
- Avoid overexplaining obvious concepts.
- Avoid SEO-blog tone and generic assistant voice.
- Include concrete, specific examples instead of vague abstractions.
- Write like a real author with judgment, not an assistant following a script.
- Avoid these overused phrases: ${FORBIDDEN_AI_PHRASES.join(", ")}.`;

  return {
    systemPrompt:
      "You are a nonfiction author writing human, opinionated, natural prose as clean semantic HTML for a rich text editor.",
    writingStylePrompt: `Writing style (${getWritingStyleLabel(input.writingStyle)}): ${getWritingStylePrompt(input.writingStyle)}`,
    voicePrompt: `Human voice intensity (${input.humanization.score}):
${variabilityPrompt}
${buildOptionalFeaturePrompt(input.humanization.options)}`.trim(),
    antiAiPrompt,
    chapterContextPrompt: input.chapterContextPrompt,
  };
}

export function buildLayeredPromptText(layers: PromptLayers): string {
  return [
    layers.systemPrompt,
    "",
    layers.writingStylePrompt,
    "",
    layers.voicePrompt,
    "",
    layers.antiAiPrompt,
    "",
    layers.chapterContextPrompt,
  ].join("\n");
}
