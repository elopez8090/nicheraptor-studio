import type {
  PublishingContentType,
  PublishingPlatformType,
  PublishingQueueStatus,
  PublishingTemplateKind,
  RepurposingWorkflow,
} from "@/lib/publishing/constants";
import {
  isPublishingContentType,
  isPublishingPlatformType,
  isPublishingQueueStatus,
  isPublishingTemplateKind,
  isRepurposingWorkflow,
} from "@/lib/publishing/constants";
import type {
  ContentCalendarEntry,
  PublishingQueueItem,
  PublishingTarget,
  PublishingTemplate,
  RepurposingJob,
} from "@/lib/publishing/types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function mapPublishingTargetRow(row: Record<string, unknown>): PublishingTarget {
  const platformRaw = String(row.platform_type ?? "markdown_export");
  const platformType = isPublishingPlatformType(platformRaw)
    ? platformRaw
    : "markdown_export";

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    platformType,
    isEnabled: Boolean(row.is_enabled),
    config: asRecord(row.config),
    webhookUrl:
      typeof row.webhook_url === "string" && row.webhook_url ? row.webhook_url : null,
    rssFeedUrl:
      typeof row.rss_feed_url === "string" && row.rss_feed_url ? row.rss_feed_url : null,
    metadata: asRecord(row.metadata),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapPublishingQueueRow(row: Record<string, unknown>): PublishingQueueItem {
  const statusRaw = String(row.status ?? "draft");
  const status: PublishingQueueStatus = isPublishingQueueStatus(statusRaw)
    ? statusRaw
    : "draft";

  const platformRaw = String(row.target_platform ?? "markdown_export");
  const targetPlatform: PublishingPlatformType = isPublishingPlatformType(platformRaw)
    ? platformRaw
    : "markdown_export";

  const contentRaw = String(row.content_type ?? "article");
  const contentType: PublishingContentType = isPublishingContentType(contentRaw)
    ? contentRaw
    : "article";

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    bodyHtml: String(row.body_html ?? ""),
    bodyMarkdown: String(row.body_markdown ?? ""),
    sourceType: String(row.source_type ?? "manual"),
    sourceArticleId:
      typeof row.source_article_id === "string" ? row.source_article_id : null,
    sourceEbookProjectId:
      typeof row.source_ebook_project_id === "string"
        ? row.source_ebook_project_id
        : null,
    sourceChapterId:
      typeof row.source_chapter_id === "string" ? row.source_chapter_id : null,
    publishingTargetId:
      typeof row.publishing_target_id === "string" ? row.publishing_target_id : null,
    targetPlatform,
    status,
    contentType,
    priority: typeof row.priority === "number" ? row.priority : 0,
    scheduledAt:
      typeof row.scheduled_at === "string" ? row.scheduled_at : null,
    publishedAt:
      typeof row.published_at === "string" ? row.published_at : null,
    errorMessage:
      typeof row.error_message === "string" && row.error_message
        ? row.error_message
        : null,
    calendarEntryId:
      typeof row.calendar_entry_id === "string" ? row.calendar_entry_id : null,
    metadata: asRecord(row.metadata),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapContentCalendarRow(row: Record<string, unknown>): ContentCalendarEntry {
  const platformRaw = String(row.target_platform ?? "markdown_export");
  const targetPlatform: PublishingPlatformType = isPublishingPlatformType(platformRaw)
    ? platformRaw
    : "markdown_export";

  const contentRaw = String(row.content_type ?? "article");
  const contentType: PublishingContentType = isPublishingContentType(contentRaw)
    ? contentRaw
    : "article";

  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    plannedPublishDate:
      typeof row.planned_publish_date === "string" ? row.planned_publish_date : null,
    publishingPriority:
      typeof row.publishing_priority === "number" ? row.publishing_priority : 0,
    contentType,
    targetPlatform,
    queueId: typeof row.queue_id === "string" ? row.queue_id : null,
    notes: String(row.notes ?? ""),
    metadata: asRecord(row.metadata),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

export function mapRepurposingJobRow(row: Record<string, unknown>): RepurposingJob {
  const workflowRaw = String(row.workflow ?? "social_snippets");
  const workflow: RepurposingWorkflow = isRepurposingWorkflow(workflowRaw)
    ? workflowRaw
    : "social_snippets";

  return {
    id: String(row.id),
    workflow,
    sourceType: String(row.source_type ?? "manual"),
    sourceArticleId:
      typeof row.source_article_id === "string" ? row.source_article_id : null,
    sourceEbookProjectId:
      typeof row.source_ebook_project_id === "string"
        ? row.source_ebook_project_id
        : null,
    sourceChapterId:
      typeof row.source_chapter_id === "string" ? row.source_chapter_id : null,
    status: String(row.status ?? "pending"),
    inputSnapshot: asRecord(row.input_snapshot),
    output: asRecord(row.output),
    errorMessage:
      typeof row.error_message === "string" && row.error_message
        ? row.error_message
        : null,
    createdAt: String(row.created_at ?? ""),
    completedAt:
      typeof row.completed_at === "string" ? row.completed_at : null,
  };
}

export function mapPublishingTemplateRow(row: Record<string, unknown>): PublishingTemplate {
  const kindRaw = String(row.template_kind ?? "article");
  const templateKind: PublishingTemplateKind = isPublishingTemplateKind(kindRaw)
    ? kindRaw
    : "article";

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    templateKind,
    platformHint:
      typeof row.platform_hint === "string" && row.platform_hint
        ? row.platform_hint
        : null,
    body: String(row.body ?? ""),
    metadata: asRecord(row.metadata),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}
