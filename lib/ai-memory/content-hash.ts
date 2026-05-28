import { createHash } from "crypto";

export function hashTextForCache(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 24);
}

export function stripHtmlToPlain(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
