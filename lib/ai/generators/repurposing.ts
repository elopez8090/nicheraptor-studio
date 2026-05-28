import type { AiGenerationResult } from "@/lib/ai/engine/types";
import { generateText } from "@/lib/ai/engine/client";
import { getModelPreset } from "@/lib/ai/engine/model-presets";
import type { RepurposingWorkflow } from "@/lib/publishing/constants";

const REPURPOSE_SYSTEM = `You are a content repurposing assistant for a solo creator's publishing workflow.
Write clear, platform-appropriate copy. Preserve factual claims from the source; do not invent statistics.
Output in the format requested. No preamble.`;

export type RepurposeInput = {
  workflow: RepurposingWorkflow;
  title: string;
  body: string;
  topic: string;
  audience: string;
  tone: string;
  templateBody?: string;
};

function buildUserPrompt(input: RepurposeInput): string {
  const ctx = [
    `Workflow: ${input.workflow}`,
    `Source title: ${input.title}`,
    input.topic ? `Topic: ${input.topic}` : "",
    input.audience ? `Audience: ${input.audience}` : "",
    input.tone ? `Tone: ${input.tone}` : "",
    input.templateBody
      ? `\nApply this template structure where relevant:\n${input.templateBody}`
      : "",
    "\n--- SOURCE CONTENT ---\n",
    input.body.slice(0, 48_000),
  ]
    .filter(Boolean)
    .join("\n");

  const instructions: Record<RepurposingWorkflow, string> = {
    ebook_chapter_to_article:
      "Turn this ebook chapter into a standalone blog article (HTML: use <h2>, <p>, <ul> only). Include intro and conclusion.",
    article_to_newsletter:
      "Rewrite as a personal newsletter issue: subject line, preview text, sections with subheads, and a single primary CTA.",
    article_to_social:
      "Create 5 short social post variants (different angles). Label each Post 1–5.",
    ebook_to_lead_magnet:
      "Outline a lead magnet PDF: title, promise, 5–7 bullet takeaways, and a simple opt-in CTA paragraph.",
    article_to_faq:
      "Create an FAQ page as HTML (<h2> per question, <p> answers). At least 8 Q&As grounded in the source.",
    article_to_thread_series:
      "Plan a 7-part thread/post series: for each part give title, hook, and 3 bullet talking points.",
    convert_to_article:
      "Convert this source into a polished blog article in HTML (<h2>, <p>, <ul>).",
    convert_to_newsletter:
      "Convert into a newsletter in markdown: subject, preview, body sections, CTA.",
    social_snippets:
      "Generate 6 platform-agnostic social snippets under 280 characters each. Number them.",
    tweet_thread_ideas:
      "Generate 2 tweet/thread outlines (8–12 tweets each). Use numbered tweets.",
    linkedin_post:
      "Write one LinkedIn post with hook, story/value, and CTA. Use short paragraphs and line breaks.",
    cta_variations:
      "Generate 8 distinct CTA lines (buttons/email closers) matched to the content. Number them.",
  };

  return `${instructions[input.workflow]}\n\n${ctx}`;
}

export async function generateRepurposingContent(
  apiKey: string,
  input: RepurposeInput,
): Promise<AiGenerationResult<string>> {
  const preset = getModelPreset("content_repurpose");
  return generateText({
    apiKey,
    system: REPURPOSE_SYSTEM,
    user: buildUserPrompt(input),
    settings: {
      ...preset,
      operation: `repurpose_${input.workflow}`,
    },
  });
}
