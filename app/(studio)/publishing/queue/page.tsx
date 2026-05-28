import { PublishingQueueBoard } from "@/components/publishing/publishing-queue-board";
import { PageSection } from "@/components/layout/page-section";
import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";

export default async function PublishingQueuePage() {
  const snapshot = await fetchPublishingSnapshot();

  return (
    <PageSection
      title="Publishing queue"
      description="Statuses: draft, scheduled, ready to publish, published, and failed. Export targets (Markdown/HTML) are enabled by default; live platform APIs are prepared for future wiring."
    >
      <PublishingQueueBoard items={snapshot.queue} activeOnly />
    </PageSection>
  );
}
