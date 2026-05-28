import type { VoiceProfileId } from "@/lib/ai-memory/types";

export const VOICE_PROFILE_IDS: readonly VoiceProfileId[] = [
  "concise",
  "analytical",
  "persuasive",
  "storytelling",
  "educational",
  "direct_response",
] as const;

const VOICE_PROFILE_PROMPT_LINES: Record<VoiceProfileId, string> = {
  concise:
    "Keep sentences tight. Prefer clarity over flourish. Cut redundancy.",
  analytical:
    "Lead with reasoning, comparisons, and cause-effect. Use precise language; avoid hype.",
  persuasive:
    "Use benefit-led framing, proof points when supported, and clear calls to action where appropriate.",
  storytelling:
    "Use narrative hooks, scenes, and character or reader journeys; still stay on-topic for nonfiction.",
  educational:
    "Teach step-by-step. Define terms on first use. Use examples and recap bullets sparingly.",
  direct_response:
    "Write with urgency and specificity. Address objections. Strong transitions toward outcomes.",
};

export function isVoiceProfileId(value: unknown): value is VoiceProfileId {
  return (
    typeof value === "string" &&
    (VOICE_PROFILE_IDS as readonly string[]).includes(value)
  );
}

export function voiceProfilePromptLine(
  profile: VoiceProfileId | null | undefined,
): string | undefined {
  if (!profile) {
    return undefined;
  }
  return VOICE_PROFILE_PROMPT_LINES[profile];
}
