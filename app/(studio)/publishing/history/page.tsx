import { PublishingQueueBoard } from "@/components/publishing/publishing-queue-board";
import { PageSection } from "@/components/layout/page-section";
import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";

export default async function PublishingHistoryPage() {
  const snapshot = await fetchPublishingSnapshot();
  const history = snapshot.queue.filter(
    (i) => i.status === "published" || i.status === "failed",
  );

  return (
    <PageSection
      title="Publishing history"
      description="Published and failed queue items. Successful publishes are also timestamped for your records."
    >
      <PublishingQueueBoard items={history} />
    </PageSection>
  );
}
