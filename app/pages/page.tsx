import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { LandingPageCard } from "@/components/landing-pages/landing-page-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { PageStack } from "@/components/layout/page-stack";
import { Button } from "@/components/ui/button";
import { fetchLandingPages } from "@/lib/landing-pages/fetch-landing-pages";

export default async function LandingPagesIndexPage() {
  const pages = await fetchLandingPages();

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Marketing Pages"
        title="Landing Pages"
        description="Build lead-gen and sales pages with conversion-focused AI sections."
      >
        <Button size="lg" asChild>
          <Link href="/pages/new">
            <Plus aria-hidden />
            New landing page
          </Link>
        </Button>
      </PageHeader>

      <PageStack className="mt-8">
        {pages.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No landing pages yet"
            description="Create your first conversion page for lead magnets, offers, launches, or local services."
            action={{ label: "Create landing page", href: "/pages/new" }}
            secondaryAction={{ label: "Go to articles", href: "/articles" }}
          />
        ) : (
          <PageSection
            title="Your landing pages"
            description={`${pages.length} page${pages.length === 1 ? "" : "s"} in your workspace.`}
          >
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {pages.map((page) => (
                <li key={page.id}>
                  <LandingPageCard page={page} />
                </li>
              ))}
            </ul>
          </PageSection>
        )}
      </PageStack>
    </PageContainer>
  );
}
