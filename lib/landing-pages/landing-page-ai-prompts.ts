import { landingPageTypeLabel } from "@/lib/landing-pages/landing-page-constants";

export type LandingPageContext = {
  title: string;
  pageType: string;
  targetAudience: string;
  offer: string;
  cta: string;
  tone: string;
  keywordTargeting?: string | null;
};

export const LANDING_PAGE_AI_SYSTEM =
  "You are an elite conversion copywriter and landing page strategist. Focus on direct-response outcomes, clarity, and persuasion. Output only what the user asks for. Use valid HTML fragments when HTML is requested.";

export type LandingPageAiToolId =
  | "improve_headline"
  | "increase_urgency"
  | "make_more_persuasive"
  | "add_emotional_triggers"
  | "improve_cta"
  | "rewrite_for_clarity"
  | "simplify_copy"
  | "seo_title"
  | "seo_description"
  | "slug";

export function buildLandingPageContextBlock(ctx: LandingPageContext): string {
  return [
    `Page title: ${ctx.title}`,
    `Page type: ${landingPageTypeLabel(ctx.pageType)}`,
    `Target audience: ${ctx.targetAudience || "(not provided)"}`,
    `Core offer: ${ctx.offer || "(not provided)"}`,
    `Primary CTA: ${ctx.cta || "(not provided)"}`,
    `Tone: ${ctx.tone || "(not provided)"}`,
    `Keyword targeting: ${ctx.keywordTargeting || "(not provided)"}`,
  ].join("\n");
}

export function buildGenerateLandingPagePrompt(ctx: LandingPageContext): string {
  return `Generate a high-converting landing page as HTML only. Include this exact conversion structure and section order:
- Headline
- Subheadline
- Primary CTA section
- Benefits section
- Problem/Solution section
- Offer stack
- Guarantee section
- Testimonials placeholders
- FAQ
- Urgency/Scarcity section
- Closing CTA

Rules:
- Use semantic tags (section, h1, h2, h3, p, ul, li, strong, button-like anchor copy).
- Include section ids in kebab-case for each major section.
- Keep copy specific and persuasive for the audience.
- Keep readability high and avoid hype/spam language.
- Return HTML fragment only.

Context:
${buildLandingPageContextBlock(ctx)}`;
}

export function getLandingPageAiInstruction(
  tool: LandingPageAiToolId,
  ctx: LandingPageContext,
): string {
  const block = buildLandingPageContextBlock(ctx);
  switch (tool) {
    case "improve_headline":
      return `Rewrite only the headline to be clearer, stronger, and more benefit-driven. Return plain text only.\n\nContext:\n${block}`;
    case "increase_urgency":
      return `Rewrite this copy with ethical urgency and time sensitivity while keeping trust high. Return revised text only.\n\nContext:\n${block}`;
    case "make_more_persuasive":
      return `Rewrite this copy to improve persuasion using specificity, benefits, and objection-handling. Return revised text only.\n\nContext:\n${block}`;
    case "add_emotional_triggers":
      return `Rewrite this copy to incorporate emotional triggers (relief, confidence, safety, aspiration) without sounding manipulative. Return revised text only.\n\nContext:\n${block}`;
    case "improve_cta":
      return `Rewrite this CTA copy for stronger action and clarity. Return plain text only.\n\nContext:\n${block}`;
    case "rewrite_for_clarity":
      return `Rewrite this copy for clarity, readability, and flow while preserving meaning. Return revised text only.\n\nContext:\n${block}`;
    case "simplify_copy":
      return `Rewrite this copy in simpler, plain-language wording suitable for a broad audience. Return revised text only.\n\nContext:\n${block}`;
    case "seo_title":
      return `Write one SEO title for this landing page (50-60 characters). Include keyword naturally. Return plain text only.\n\nContext:\n${block}`;
    case "seo_description":
      return `Write one meta description for this landing page (150-160 characters). Include keyword naturally. Return plain text only.\n\nContext:\n${block}`;
    case "slug":
      return `Suggest one URL slug (lowercase, hyphen-separated, no slash). Return plain text only.\n\nContext:\n${block}`;
    default:
      return block;
  }
}
