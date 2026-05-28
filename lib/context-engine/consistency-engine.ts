import { stripHtmlToPlain } from "@/lib/ai-memory/content-hash";

export type ConsistencyReport = {
  repeatedPhrases: string[];
  terminologyReminders: string[];
  warnings: string[];
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "your",
  "have",
  "will",
  "into",
  "about",
  "their",
  "they",
  "what",
  "when",
  "which",
  "while",
  "where",
  "there",
  "these",
  "those",
  "been",
  "being",
  "than",
  "then",
  "them",
  "also",
  "only",
  "more",
  "most",
  "some",
  "such",
  "each",
  "other",
  "over",
  "under",
  "after",
  "before",
  "through",
  "between",
  "within",
  "without",
  "because",
  "would",
  "could",
  "should",
  "might",
  "must",
  "does",
  "done",
  "make",
  "made",
  "like",
  "just",
  "even",
  "still",
  "very",
  "much",
  "many",
  "well",
  "back",
  "here",
  "how",
  "our",
  "out",
  "not",
  "you",
  "are",
  "was",
  "were",
  "can",
  "all",
  "any",
  "but",
  "its",
  "it's",
  "don't",
  "doesn't",
]);

function tokenize(plain: string): string[] {
  return plain
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function extractRepeatedPhrases(plain: string, minWords = 4): string[] {
  const words = tokenize(plain);
  if (words.length < minWords * 2) {
    return [];
  }

  const counts = new Map<string, number>();
  for (let i = 0; i <= words.length - minWords; i++) {
    const phrase = words.slice(i, i + minWords).join(" ");
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase]) => phrase);
}

export function analyzeWritingConsistency(input: {
  priorChapterPlainTexts: string[];
  projectTerminology: string[];
  expectedToneKeywords?: string[];
}): ConsistencyReport {
  const combined = input.priorChapterPlainTexts.join("\n");
  const repeatedPhrases = extractRepeatedPhrases(combined);

  const terminologyReminders = input.projectTerminology
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  const warnings: string[] = [];
  if (repeatedPhrases.length >= 4) {
    warnings.push(
      "Prior chapters reuse several multi-word phrases; vary transitions and section openers in this chapter.",
    );
  }

  if (input.expectedToneKeywords?.length) {
    const lower = combined.toLowerCase();
    const missing = input.expectedToneKeywords.filter(
      (kw) => !lower.includes(kw.toLowerCase()),
    );
    if (missing.length === input.expectedToneKeywords.length) {
      warnings.push(
        "Prior chapter text may have drifted from the selected tone; realign voice with project style settings.",
      );
    }
  }

  return {
    repeatedPhrases,
    terminologyReminders,
    warnings,
  };
}

export function formatConsistencyGuidanceBlock(
  report: ConsistencyReport,
): string | undefined {
  const lines: string[] = [];

  if (report.terminologyReminders.length) {
    lines.push(
      `Use these terms consistently: ${report.terminologyReminders.join(", ")}`,
    );
  }
  if (report.repeatedPhrases.length) {
    lines.push(
      `Avoid reusing these exact phrases from earlier chapters: ${report.repeatedPhrases.join("; ")}`,
    );
  }
  for (const w of report.warnings) {
    lines.push(w);
  }

  if (!lines.length) {
    return undefined;
  }

  return `Writing consistency:\n${lines.map((l) => `- ${l}`).join("\n")}`;
}

export function plainTextFromChapterHtml(html: string | null | undefined): string {
  if (!html?.trim()) {
    return "";
  }
  return stripHtmlToPlain(html);
}
