import { ClusterGroups } from "@/components/planner/cluster-groups";
import { RelationshipMap } from "@/components/planner/relationship-map";
import { PageSection } from "@/components/layout/page-section";
import { buildLinkableEntities } from "@/lib/planner/build-linkable-entities";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";

export default async function PlannerClustersPage() {
  const [snapshot, entities] = await Promise.all([
    fetchPlannerSnapshot(),
    buildLinkableEntities(),
  ]);

  return (
    <div className="space-y-10">
      <PageSection
        title="Topic clusters"
        description="Group pillar themes and supporting ideas. Assign topics from the unclustered list."
      >
        <ClusterGroups
          initialClusters={snapshot.clusters}
          initialTopics={snapshot.topics}
        />
      </PageSection>
      <PageSection title="Relationship map">
        <RelationshipMap
          initialRelationships={snapshot.relationships}
          entities={entities}
        />
      </PageSection>
    </div>
  );
}
