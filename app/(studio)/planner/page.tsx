import { GenerateIdeasPanel } from "@/components/planner/generate-ideas-panel";
import { PlannerOverview } from "@/components/planner/planner-overview";
import { StrategicSuggestionsPanel } from "@/components/planner/strategic-suggestions-panel";
import { PageSection } from "@/components/layout/page-section";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";

export default async function PlannerPage() {
  const snapshot = await fetchPlannerSnapshot();

  return (
    <>
      <PlannerOverview snapshot={snapshot} />
      <PageSection title="AI planning">
        <div className="grid gap-6 xl:grid-cols-2">
          <GenerateIdeasPanel />
          <StrategicSuggestionsPanel />
        </div>
      </PageSection>
    </>
  );
}
