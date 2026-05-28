export const ARTICLE_TYPE_OPTIONS = [
  { value: "blog_post", label: "Blog post" },
  { value: "seo_article", label: "SEO article" },
  { value: "how_to", label: "How-to article" },
  { value: "listicle", label: "Listicle" },
  { value: "review", label: "Review article" },
  { value: "local_seo", label: "Local SEO page" },
  { value: "newsletter", label: "Newsletter article" },
] as const;

export type ArticleTypeValue = (typeof ARTICLE_TYPE_OPTIONS)[number]["value"];

export const WORD_COUNT_TARGET_PRESETS = [800, 1200, 1800, 2500] as const;

export const ARTICLE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "outline", label: "Outline ready" },
  { value: "generated", label: "Generated" },
  { value: "published", label: "Published" },
] as const;

export type ArticleStatusValue = (typeof ARTICLE_STATUS_OPTIONS)[number]["value"];

export function articleTypeLabel(value: string): string {
  return (
    ARTICLE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value
  );
}
