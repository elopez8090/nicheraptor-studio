import { articleTypeLabel } from "@/lib/articles/article-constants";

export type ArticleContext = {
  topic: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  audience: string;
  tone: string;
  articleType: string;
  wordCountTarget: number | null;
  title: string;
};

export function buildArticleContextBlock(ctx: ArticleContext): string {
  const secondary =
    ctx.secondaryKeywords.length > 0
      ? ctx.secondaryKeywords.join(", ")
      : "(none)";
  const words = ctx.wordCountTarget
    ? `Target length: about ${ctx.wordCountTarget} words.`
    : "Use a sensible length for the article type.";

  return [
    `Topic: ${ctx.topic}`,
    `Title (working): ${ctx.title}`,
    `Primary keyword: ${ctx.targetKeyword}`,
    `Secondary keywords: ${secondary}`,
    `Audience: ${ctx.audience}`,
    `Tone: ${ctx.tone}`,
    `Article type: ${articleTypeLabel(ctx.articleType)}`,
    words,
  ].join("\n");
}

export const ARTICLE_AI_SYSTEM =
  "You are an expert SEO content writer and editor. Follow instructions precisely. When asked for HTML, output valid HTML fragments only (no markdown fences, no commentary). When asked for plain text, output only that text.";

export type ArticleAiToolId =
  | "rewrite_section"
  | "improve_intro"
  | "add_faq"
  | "meta_title"
  | "meta_description"
  | "slug";

export function getArticleAiInstruction(
  tool: ArticleAiToolId,
  ctx: ArticleContext,
): string {
  const block = buildArticleContextBlock(ctx);
  switch (tool) {
    case "rewrite_section":
      return `Rewrite the following passage for clarity and flow. Keep the same meaning. Match tone: ${ctx.tone}. Naturally include the primary keyword "${ctx.targetKeyword}" if it fits without stuffing.\n\nContext:\n${block}`;
    case "improve_intro":
      return `Improve only the introduction (opening 1–2 paragraphs) of this article. Make it hook the reader, state the promise, and use the primary keyword "${ctx.targetKeyword}" once naturally. Return only the revised introduction as HTML (p and h2 tags as needed).\n\nContext:\n${block}`;
    case "add_faq":
      return `Add an FAQ section at the end of the article with 4–6 questions and concise answers related to the topic and keyword "${ctx.targetKeyword}". Return only the new FAQ block as HTML (h2 "FAQ" plus h3/p pairs). Do not repeat the full article.\n\nContext:\n${block}`;
    case "meta_title":
      return `Write one SEO meta title (50–60 characters) for this article. Primary keyword: "${ctx.targetKeyword}". Output plain text only, no quotes.\n\nContext:\n${block}`;
    case "meta_description":
      return `Write one meta description (150–160 characters) for this article. Include the primary keyword naturally. Output plain text only.\n\nContext:\n${block}`;
    case "slug":
      return `Suggest one URL slug (lowercase, hyphen-separated, no leading slash) using the primary keyword when possible. Output plain text only.\n\nContext:\n${block}`;
    default:
      return block;
  }
}

export function buildOutlineUserPrompt(ctx: ArticleContext): string {
  return `Create a detailed article outline for the following brief. Return HTML only: one h1 for the title, then h2 sections with a short bullet list (ul/li) under each describing what to cover. Do not write the full article.

${buildArticleContextBlock(ctx)}`;
}

export function buildFullArticleUserPrompt(
  ctx: ArticleContext,
  outlineHtml?: string,
): string {
  const outlinePart = outlineHtml?.trim()
    ? `\n\nFollow this outline structure:\n${outlineHtml}`
    : "";
  return `Write the complete article as HTML (h1, h2, h3, p, ul, li as appropriate). Match the tone and audience. Use the primary keyword "${ctx.targetKeyword}" naturally in the title, intro, one subheading, and body — avoid keyword stuffing.${outlinePart}

${buildArticleContextBlock(ctx)}`;
}
