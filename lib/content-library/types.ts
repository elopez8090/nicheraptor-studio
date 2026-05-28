/**
 * Future-ready: `metadata` on items can store block order (drag-and-drop),
 * template composition graphs, prompt-chain steps, and AI memory keys — without schema churn.
 */

export const CONTENT_LIBRARY_TYPES = [
  "snippet",
  "framework",
  "prompt",
  "cta",
  "disclaimer",
  "introduction",
  "conclusion",
  "faq",
  "author_bio",
  "checklist",
] as const;

export type ContentLibraryType = (typeof CONTENT_LIBRARY_TYPES)[number];

export function isContentLibraryType(value: unknown): value is ContentLibraryType {
  return (
    typeof value === "string" &&
    (CONTENT_LIBRARY_TYPES as readonly string[]).includes(value)
  );
}

export const CONTENT_LIBRARY_TYPE_LABELS: Record<ContentLibraryType, string> = {
  snippet: "Snippet",
  framework: "Writing framework",
  prompt: "AI prompt",
  cta: "CTA block",
  disclaimer: "Disclaimer",
  introduction: "Introduction",
  conclusion: "Conclusion",
  faq: "FAQ section",
  author_bio: "Author bio",
  checklist: "Checklist",
};

/** Types shown on dedicated sub-routes */
export const LIBRARY_ROUTE_TYPES = {
  snippets: ["snippet"] as const,
  frameworks: ["framework"] as const,
  prompts: ["prompt"] as const,
} as const;

export type ContentLibraryItem = {
  id: string;
  type: ContentLibraryType;
  title: string;
  content: string;
  tags: string[];
  favorite: boolean;
  usageCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ContentLibraryTag = {
  id: string;
  name: string;
  createdAt: string;
};

export type ContentLibraryListFilters = {
  type?: ContentLibraryType | ContentLibraryType[];
  tag?: string;
  favorite?: boolean;
  search?: string;
  limit?: number;
};
