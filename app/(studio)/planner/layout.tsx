import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { PlannerSubnav } from "@/components/planner/planner-subnav";

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Strategy"
        title="Content planner"
        description="Organize ideas, topic clusters, relationships, and publishing roadmaps — with AI that knows your existing ebooks and articles."
      />
      <PageStack>
        <PlannerSubnav />
        {children}
      </PageStack>
    </PageContainer>
  );
}
