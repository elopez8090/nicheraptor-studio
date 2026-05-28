export const WRITING_STYLE_OPTIONS = [
  { value: "conversational", label: "Conversational" },
  { value: "professional", label: "Professional" },
  { value: "storytelling", label: "Storytelling" },
  { value: "opinionated", label: "Opinionated" },
  { value: "casual-expert", label: "Casual expert" },
  { value: "direct-response", label: "Direct-response/persuasive" },
  { value: "educational-teacher", label: "Educational teacher" },
  { value: "minimalist", label: "Minimalist" },
] as const;

export type WritingStyle = (typeof WRITING_STYLE_OPTIONS)[number]["value"];

const LEGACY_WRITING_STYLE_ALIASES: Record<string, WritingStyle> = {
  friendly: "conversational",
  authoritative: "opinionated",
  educational: "educational-teacher",
};

export function isWritingStyle(value: unknown): value is WritingStyle {
  return WRITING_STYLE_OPTIONS.some((option) => option.value === value);
}

export function normalizeWritingStyle(
  value: unknown,
  fallback: WritingStyle = "conversational",
): WritingStyle {
  if (isWritingStyle(value)) {
    return value;
  }
  if (typeof value === "string" && LEGACY_WRITING_STYLE_ALIASES[value]) {
    return LEGACY_WRITING_STYLE_ALIASES[value];
  }
  return fallback;
}

export function getWritingStyleLabel(style: WritingStyle): string {
  return (
    WRITING_STYLE_OPTIONS.find((option) => option.value === style)?.label ??
    "Conversational"
  );
}

export function getWritingStylePrompt(style: WritingStyle): string {
  switch (style) {
    case "professional":
      return "Professional: precise language, clear structure, confident but not stiff.";
    case "storytelling":
      return "Storytelling: narrative framing, scene-driven examples, and memorable flow.";
    case "opinionated":
      return "Opinionated: take clear positions, challenge weak assumptions, and defend claims.";
    case "casual-expert":
      return "Casual expert: knowledgeable but plainspoken, practical, and approachable.";
    case "direct-response":
      return "Direct-response/persuasive: action-oriented, benefit-led, and focused on outcomes.";
    case "educational-teacher":
      return "Educational teacher: explain with clarity, examples, and progressive understanding.";
    case "minimalist":
      return "Minimalist: concise, strong signal-to-noise ratio, no unnecessary exposition.";
    case "conversational":
    default:
      return "Conversational: natural cadence, reader-first phrasing, and effortless flow.";
  }
}
