import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { PublishingSubnav } from "@/components/publishing/publishing-subnav";

export default function PublishingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Automation"
        title="Publishing hub"
        description="Queue content, plan your calendar, repurpose ebooks and articles, and prepare exports for WordPress, newsletters, and more — built for solo publishing workflows."
      />
      <PageStack>
        <PublishingSubnav />
        {children}
      </PageStack>
    </PageContainer>
  );
}
