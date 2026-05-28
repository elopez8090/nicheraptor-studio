export function stripMarkdownCodeFences(text: string): string {
  return text
    .replace(/^```(?:json|html|markdown|md)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

export function parseJsonFromModelContent<T>(raw: string): T {
  const cleaned = stripMarkdownCodeFences(raw);
  return JSON.parse(cleaned) as T;
}
