export const JSON_ONLY_SYSTEM_PROMPT =
  "You respond with a single JSON object only. No markdown, no code fences, no extra text.";

export const HTML_FRAGMENT_SYSTEM_HINT =
  "Output valid HTML fragments only (no markdown fences, no commentary).";

export type LayeredPromptParts = {
  system?: string;
  user: string;
};

export function buildUserMessageWithInstruction(
  instruction: string,
  body: string,
): string {
  return `${instruction}\n\n---\n\n${body}`;
}

export function buildLayeredPromptText(parts: {
  systemLayers?: string[];
  userSections: string[];
}): string {
  const blocks: string[] = [];
  if (parts.systemLayers?.length) {
    blocks.push(parts.systemLayers.join("\n\n"));
  }
  blocks.push(parts.userSections.join("\n\n"));
  return blocks.join("\n\n");
}
