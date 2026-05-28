export const FORBIDDEN_AI_PHRASES = [
  "In today's fast-paced world",
  "It's important to note",
  "Delve",
  "Unlock the power",
  "Whether you're",
  "In conclusion",
  "Seamlessly",
  "Game-changer",
  "At the end of the day",
] as const;

const PHRASE_REPLACEMENTS: Record<string, string> = {
  "in today's fast-paced world": "right now",
  "it's important to note": "notice",
  delve: "explore",
  "unlock the power": "use",
  "whether you're": "if you are",
  "in conclusion": "to wrap up",
  seamlessly: "smoothly",
  "game-changer": "major shift",
  "at the end of the day": "ultimately",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applyForbiddenPhraseFilter(text: string): {
  text: string;
  replacements: number;
} {
  let output = text;
  let replacements = 0;

  for (const phrase of FORBIDDEN_AI_PHRASES) {
    const replacement = PHRASE_REPLACEMENTS[phrase.toLowerCase()];
    if (!replacement) {
      continue;
    }
    const regex = new RegExp(escapeRegExp(phrase), "gi");
    output = output.replace(regex, () => {
      replacements += 1;
      return replacement;
    });
  }

  return { text: output, replacements };
}
