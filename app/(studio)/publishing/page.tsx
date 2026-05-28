import { ContentCalendarPanel } from "@/components/publishing/content-calendar-panel";
import { PublishingTargetsPanel } from "@/components/publishing/publishing-targets-panel";
import { PublishingTemplatesPanel } from "@/components/publishing/publishing-templates-panel";
import { RepurposingWorkbench } from "@/components/publishing/repurposing-workbench";
import { PageSection } from "@/components/layout/page-section";
import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PublishingHubPage() {
  const snapshot = await fetchPublishingSnapshot();
  const activeQueue = snapshot.queue.filter(
    (i) => i.status !== "published" && i.status !== "failed",
  );

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">In queue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">{activeQueue.length}</p>
            <Button variant="link" className="h-auto p-0 mt-2 text-sm" asChild>
              <Link href="/publishing/queue">Manage queue</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {snapshot.calendar.length}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Planned publish slots</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Targets enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {snapshot.targets.filter((t) => t.isEnabled).length}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              of {snapshot.targets.length} platforms
            </p>
          </CardContent>
        </Card>
      </div>

      <PageSection title="Repurposing & AI workflows">
        <RepurposingWorkbench
          recentJobs={snapshot.recentJobs}
          templates={snapshot.templates}
        />
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-2">
        <PublishingTargetsPanel targets={snapshot.targets} />
        <ContentCalendarPanel entries={snapshot.calendar} />
      </div>

      <PageSection title="Templates">
        <PublishingTemplatesPanel templates={snapshot.templates} />
      </PageSection>
    </>
  );
}
