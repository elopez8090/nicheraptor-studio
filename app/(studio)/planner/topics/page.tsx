import { TopicsPlannerWorkspace } from "@/components/planner/topics-planner-workspace";
import { PageSection } from "@/components/layout/page-section";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";

export default async function PlannerTopicsPage() {
  const snapshot = await fetchPlannerSnapshot();

  return (
    <PageSection
      title="Topic board"
      description="Kanban-style workflow from idea through published. Drag statuses via the dropdown on each card."
    >
      <TopicsPlannerWorkspace initialTopics={snapshot.topics} />
    </PageSection>
  );
}
