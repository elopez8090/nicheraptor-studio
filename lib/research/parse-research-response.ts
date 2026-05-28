import type { ResearchSource } from "@/lib/research/types";

export type ParsedResearchPayload = {
  title: string;
  summary: string;
  content: string;
  sources: ResearchSource[];
};

function normalizeSources(raw: unknown): ResearchSource[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: ResearchSource[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const url = "url" in item ? String(item.url).trim() : "";
    const title = "title" in item ? String(item.title).trim() : "";
    if (!url.startsWith("http")) {
      continue;
    }
    out.push({ url, title: title || url });
  }
  return out;
}

export function parseResearchResponseJson(text: string): ParsedResearchPayload {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Research model returned invalid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Research model returned invalid JSON.");
  }
  const record = parsed as Record<string, unknown>;
  const title = String(record.title ?? "Research notes").trim() || "Research notes";
  const summary = String(record.summary ?? "").trim();
  const content = String(record.content ?? "").trim();
  if (!content) {
    throw new Error("Research response did not include content.");
  }
  return {
    title,
    summary,
    content,
    sources: normalizeSources(record.sources),
  };
}
