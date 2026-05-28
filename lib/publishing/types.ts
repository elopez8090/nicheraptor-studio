import type {
  PublishingContentType,
  PublishingPlatformType,
  PublishingQueueStatus,
  PublishingTemplateKind,
  RepurposingWorkflow,
} from "@/lib/publishing/constants";

export type PublishingTarget = {
  id: string;
  name: string;
  platformType: PublishingPlatformType;
  isEnabled: boolean;
  config: Record<string, unknown>;
  webhookUrl: string | null;
  rssFeedUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PublishingQueueItem = {
  id: string;
  title: string;
  bodyHtml: string;
  bodyMarkdown: string;
  sourceType: string;
  sourceArticleId: string | null;
  sourceEbookProjectId: string | null;
  sourceChapterId: string | null;
  publishingTargetId: string | null;
  targetPlatform: PublishingPlatformType;
  status: PublishingQueueStatus;
  contentType: PublishingContentType;
  priority: number;
  scheduledAt: string | null;
  publishedAt: string | null;
  errorMessage: string | null;
  calendarEntryId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ContentCalendarEntry = {
  id: string;
  title: string;
  plannedPublishDate: string | null;
  publishingPriority: number;
  contentType: PublishingContentType;
  targetPlatform: PublishingPlatformType;
  queueId: string | null;
  notes: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type RepurposingJob = {
  id: string;
  workflow: RepurposingWorkflow;
  sourceType: string;
  sourceArticleId: string | null;
  sourceEbookProjectId: string | null;
  sourceChapterId: string | null;
  status: string;
  inputSnapshot: Record<string, unknown>;
  output: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type PublishingTemplate = {
  id: string;
  name: string;
  templateKind: PublishingTemplateKind;
  platformHint: string | null;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PublishingSnapshot = {
  targets: PublishingTarget[];
  queue: PublishingQueueItem[];
  calendar: ContentCalendarEntry[];
  templates: PublishingTemplate[];
  recentJobs: RepurposingJob[];
};
