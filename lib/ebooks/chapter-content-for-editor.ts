/**
 * Normalizes stored chapter content (markdown or HTML) for TipTap.
 */
export function chapterContentToEditorHtml(
  raw: string | null | undefined,
): string {
  if (!raw?.trim()) {
    return "";
  }

  const trimmed = raw.trim();

  if (looksLikeHtml(trimmed)) {
    return trimmed;
  }

  return markdownToSimpleHtml(trimmed);
}

function looksLikeHtml(value: string): boolean {
  if (value.startsWith("<")) {
    return true;
  }

  return /<(p|h[1-6]|ul|ol|li|blockquote|strong|em|br)\b/i.test(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function markdownToSimpleHtml(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (!listType || listItems.length === 0) {
      listType = null;
      listItems = [];
      return;
    }
    const tag = listType;
    blocks.push(
      `<${tag}>${listItems.map((item) => `<li>${item}</li>`).join("")}</${tag}>`,
    );
    listType = null;
    listItems = [];
  };

  const flushParagraph = (paragraphLines: string[]) => {
    if (paragraphLines.length === 0) {
      return;
    }
    const inline = paragraphLines
      .map((line) => applyInlineMarkdown(escapeHtml(line)))
      .join("<br />");
    blocks.push(`<p>${inline}</p>`);
  };

  let paragraphBuffer: string[] = [];

  const flushParagraphBuffer = () => {
    flushParagraph(paragraphBuffer);
    paragraphBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      flushParagraphBuffer();
      continue;
    }

    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      flushList();
      flushParagraphBuffer();
      const level = Math.min(headingMatch[1].length, 6);
      const text = applyInlineMarkdown(escapeHtml(headingMatch[2]));
      blocks.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    const bulletMatch = /^[-*+]\s+(.+)$/.exec(trimmed);
    if (bulletMatch) {
      flushParagraphBuffer();
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(applyInlineMarkdown(escapeHtml(bulletMatch[1])));
      continue;
    }

    const orderedMatch = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (orderedMatch) {
      flushParagraphBuffer();
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(applyInlineMarkdown(escapeHtml(orderedMatch[1])));
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushList();
      flushParagraphBuffer();
      const quote = applyInlineMarkdown(escapeHtml(trimmed.replace(/^>\s?/, "")));
      blocks.push(`<blockquote><p>${quote}</p></blockquote>`);
      continue;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  }

  flushList();
  flushParagraphBuffer();

  return blocks.join("");
}

function applyInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}
