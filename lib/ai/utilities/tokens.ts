/** Rough token estimate (~4 chars per token for English prose). */
export function estimateTokenCount(text: string): number {
  if (!text) {
    return 0;
  }
  return Math.ceil(text.length / 4);
}

export function estimateMaxTokensForWordTarget(wordCount: number): number {
  return Math.min(16_000, Math.max(4096, Math.round(wordCount * 2.2)));
}
