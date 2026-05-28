export const PUBLISHING_PLATFORM_TYPES = [
  "wordpress",
  "webflow",
  "ghost",
  "beehiiv",
  "substack",
  "medium",
  "markdown_export",
  "html_export",
] as const;

export type PublishingPlatformType = (typeof PUBLISHING_PLATFORM_TYPES)[number];

export const PUBLISHING_QUEUE_STATUSES = [
  "draft",
  "scheduled",
  "ready_to_publish",
  "published",
  "failed",
] as const;

export type PublishingQueueStatus = (typeof PUBLISHING_QUEUE_STATUSES)[number];

export const PUBLISHING_CONTENT_TYPES = [
  "article",
  "newsletter",
  "social",
  "lead_magnet",
  "faq",
  "thread",
] as const;

export type PublishingContentType = (typeof PUBLISHING_CONTENT_TYPES)[number];

export const REPURPOSING_WORKFLOWS = [
  "ebook_chapter_to_article",
  "article_to_newsletter",
  "article_to_social",
  "ebook_to_lead_magnet",
  "article_to_faq",
  "article_to_thread_series",
  "convert_to_article",
  "convert_to_newsletter",
  "social_snippets",
  "tweet_thread_ideas",
  "linkedin_post",
  "cta_variations",
] as const;

export type RepurposingWorkflow = (typeof REPURPOSING_WORKFLOWS)[number];

export const REPURPOSING_UI_ACTIONS = [
  { id: "convert_to_article" as const, label: "Convert to article" },
  { id: "convert_to_newsletter" as const, label: "Convert to newsletter" },
  { id: "social_snippets" as const, label: "Generate social snippets" },
  { id: "tweet_thread_ideas" as const, label: "Generate tweet/thread ideas" },
  { id: "linkedin_post" as const, label: "Generate LinkedIn post" },
  { id: "cta_variations" as const, label: "Generate CTA variations" },
] as const;

export const PUBLISHING_TEMPLATE_KINDS = [
  "newsletter",
  "article",
  "cta",
  "social",
] as const;

export type PublishingTemplateKind = (typeof PUBLISHING_TEMPLATE_KINDS)[number];

export const DEFAULT_PLATFORM_LABELS: Record<PublishingPlatformType, string> = {
  wordpress: "WordPress",
  webflow: "Webflow",
  ghost: "Ghost",
  beehiiv: "Beehiiv",
  substack: "Substack",
  medium: "Medium",
  markdown_export: "Markdown export",
  html_export: "HTML export",
};

export function isPublishingPlatformType(
  value: string,
): value is PublishingPlatformType {
  return (PUBLISHING_PLATFORM_TYPES as readonly string[]).includes(value);
}

export function isPublishingQueueStatus(
  value: string,
): value is PublishingQueueStatus {
  return (PUBLISHING_QUEUE_STATUSES as readonly string[]).includes(value);
}

export function isPublishingContentType(
  value: string,
): value is PublishingContentType {
  return (PUBLISHING_CONTENT_TYPES as readonly string[]).includes(value);
}

export function isRepurposingWorkflow(value: string): value is RepurposingWorkflow {
  return (REPURPOSING_WORKFLOWS as readonly string[]).includes(value);
}

export function isPublishingTemplateKind(
  value: string,
): value is PublishingTemplateKind {
  return (PUBLISHING_TEMPLATE_KINDS as readonly string[]).includes(value);
}
