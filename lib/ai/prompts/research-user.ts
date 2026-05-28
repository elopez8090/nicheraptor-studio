import type { ResearchAction } from "@/lib/research/types";

export type ResearchPromptContext = {
  action: ResearchAction;
  ebookTitle: string;
  audience: string;
  goal: string;
  chapterTitle?: string;
  chapterSummary?: string;
  chapterNumber?: number;
};

const ACTION_INSTRUCTIONS: Record<ResearchAction, string> = {
  topic:
    "Produce a broad research brief for the ebook topic: key concepts, misconceptions, vocabulary, and angles that fit the audience.",
  chapter:
    "Produce chapter-scoped research aligned with the chapter title and outline summary: subtopics, arguments, and what readers need clarified.",
  statistics:
    "List statistics and data points that are commonly cited in this space. For each item, note confidence (high/medium/low) and whether the author should verify before publishing.",
  trends:
    "Summarize current trends, shifts, and emerging themes relevant to the ebook. Distinguish durable trends from hype.",
  faqs:
    "List frequently asked questions from the target audience with concise, accurate answers.",
  examples:
    "Provide concrete examples, case studies, scenarios, and analogies the author can use in chapters.",
};

export function buildResearchUserPrompt(ctx: ResearchPromptContext): string {
  const chapterBlock =
    ctx.chapterTitle && ctx.chapterSummary
      ? `
Chapter focus:
- Number: ${ctx.chapterNumber ?? "—"}
- Title: ${ctx.chapterTitle}
- Outline summary: ${ctx.chapterSummary}
`
      : "";

  return `
Research task: ${ctx.action}
${ACTION_INSTRUCTIONS[ctx.action]}

Ebook:
- Title: ${ctx.ebookTitle}
- Audience: ${ctx.audience}
- Reader goal: ${ctx.goal}
${chapterBlock}

Return JSON with this exact shape:
{
  "title": "short label for this research card",
  "summary": "1-3 sentence overview",
  "content": "detailed notes in plain text with bullet lines where helpful",
  "sources": [{ "url": "https://...", "title": "human-readable source name" }]
}

Include 3-8 sources when reasonable. URLs must be https.
`;
}
