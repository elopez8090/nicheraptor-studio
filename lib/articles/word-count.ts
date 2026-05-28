/** Approximate word count from HTML or plain text. */
export function countWordsFromHtml(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) {
    return 0;
  }
  return text.split(/\s+/).filter(Boolean).length;
}
