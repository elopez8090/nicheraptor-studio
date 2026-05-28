import { RoadmapCards } from "@/components/planner/roadmap-cards";
import { PageSection } from "@/components/layout/page-section";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";

export default async function PlannerRoadmapsPage() {
  const snapshot = await fetchPlannerSnapshot();

  return (
    <PageSection
      title="Publishing roadmaps"
      description="Plan launch sequences and milestones. Structured for future calendar and scheduler integration."
    >
      <RoadmapCards initialRoadmaps={snapshot.roadmaps} />
    </PageSection>
  );
}
