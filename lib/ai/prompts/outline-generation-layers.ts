import {
  buildHumanizationLayers,
  buildLayeredPromptText,
} from "@/lib/ai/prompts/humanization-layers";
import {
  resolveHumanizationConfig,
  type HumanizationOptions,
  type HumanScore,
} from "@/lib/ai/humanization/config";
import { normalizeWritingStyle, type WritingStyle } from "@/lib/ai/styles/writing-styles";

export function buildOutlineGenerationPrompt(input: {
  topic: string;
  audience: string;
  goal: string;
  writingStyle?: WritingStyle;
  humanScore?: HumanScore;
  humanizationOptions?: Partial<HumanizationOptions> | null;
  chapterLines: string[];
  lengthLines: string[];
}): string {
  const chapterContextPrompt = `Create a detailed ebook outline.

Requirements:
- Topic: ${input.topic}
- Audience: ${input.audience}
- Goal: ${input.goal}
${input.chapterLines.join("\n")}
${input.lengthLines.join("\n")}
- Each chapter must have a clear, compelling title and a 2-3 sentence summary.

Respond with ONLY valid JSON matching this exact TypeScript shape:
{
  "title": string,
  "audience": string,
  "goal": string,
  "chapters": [
    {
      "title": string,
      "summary": string
    }
  ]
}

Do not include any extra fields or prose outside the JSON.`;

  const layers = buildHumanizationLayers({
    writingStyle: normalizeWritingStyle(input.writingStyle),
    humanization: resolveHumanizationConfig({
      score: input.humanScore,
      options: input.humanizationOptions,
    }),
    seedHint: `${input.topic}:${input.audience}:${input.goal}`,
    chapterContextPrompt,
  });

  return buildLayeredPromptText(layers);
}
