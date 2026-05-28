export const AI_REWRITE_TOOL_IDS = [
  "rewrite_selected",
  "improve_intro",
  "expand_section",
  "make_persuasive",
  "simplify_language",
  "fix_grammar",
] as const;

export type AiRewriteToolId = (typeof AI_REWRITE_TOOL_IDS)[number];

export function isAiRewriteToolId(value: unknown): value is AiRewriteToolId {
  return (
    typeof value === "string" &&
    (AI_REWRITE_TOOL_IDS as readonly string[]).includes(value)
  );
}

export const AI_REWRITE_TOOL_LABELS: Record<AiRewriteToolId, string> = {
  rewrite_selected: "Rewrite Selected Text",
  improve_intro: "Improve Intro",
  expand_section: "Expand Section",
  make_persuasive: "Make More Persuasive",
  simplify_language: "Simplify Language",
  fix_grammar: "Fix Grammar",
};

export function getAiRewriteInstruction(tool: AiRewriteToolId): string {
  switch (tool) {
    case "rewrite_selected":
      return "Rewrite the passage for clarity and flow while preserving the core meaning and tone. Return only the rewritten text.";
    case "improve_intro":
      return "Improve this introduction so it hooks the reader, states the promise clearly, and sets up what follows. Return only the improved text.";
    case "expand_section":
      return "Expand this section with useful detail, examples, or explanation. Do not add fluff. Return only the expanded text.";
    case "make_persuasive":
      return "Make this passage more persuasive and compelling for the reader while staying honest and on-topic. Return only the revised text.";
    case "simplify_language":
      return "Simplify the language for easier reading. Use shorter sentences and plain words where possible. Return only the simplified text.";
    case "fix_grammar":
      return "Fix grammar, spelling, and punctuation. Improve awkward phrasing lightly without changing meaning. Return only the corrected text.";
    default: {
      const _exhaustive: never = tool;
      return _exhaustive;
    }
  }
}
