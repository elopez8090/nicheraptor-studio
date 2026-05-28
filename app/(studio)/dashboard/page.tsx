import Link from "next/link";

import { Plus } from "lucide-react";



import { DashboardProductivity } from "@/components/workspace/dashboard-productivity";
import { DashboardContentTabs } from "@/components/workspace/dashboard-content-tabs";
import { DashboardArticlesPreview } from "@/components/ebooks/dashboard-articles-preview";

import { DashboardProjectLibrary } from "@/components/ebooks/dashboard-project-library";

import { DashboardStatsRow } from "@/components/ebooks/dashboard-stats-row";

import { PageContainer } from "@/components/layout/page-container";

import { PageHeader } from "@/components/layout/page-header";

import { PageSection } from "@/components/layout/page-section";

import { PageStack } from "@/components/layout/page-stack";

import { Button } from "@/components/ui/button";

import { fetchArticles } from "@/lib/articles/fetch-articles";
import { fetchLandingPages } from "@/lib/landing-pages/fetch-landing-pages";

import {

  computeEbookProjectLibraryStats,

  fetchEbookProjects,

} from "@/lib/ebooks/fetch-ebook-projects";



export default async function DashboardPage() {

  const [projects, articles, pages] = await Promise.all([

    fetchEbookProjects({ includeArchived: true }),

    fetchArticles(),

    fetchLandingPages(),

  ]);

  const stats = computeEbookProjectLibraryStats(projects);



  return (

    <PageContainer size="wide">

      <PageHeader

        eyebrow="Overview"

        title="Dashboard"

        description="Your ebooks and articles in one place — track progress, filter your library, and jump back into writing."

      >

        <Button size="lg" className="w-full sm:w-auto" asChild>

          <Link href="/create">

            <Plus aria-hidden />

            Quick create

          </Link>

        </Button>

      </PageHeader>



      <PageStack>

        <DashboardStatsRow stats={stats} />

        <DashboardProductivity projects={projects} />

        <PageSection

          title="Workspace tabs"

          description="Organize your dashboard by content type and jump into the right area fast."

          className="rounded-2xl border border-border/60 bg-card/40 p-6 ring-1 ring-border/50 sm:p-8"

        >

          <DashboardContentTabs ebooks={projects} articles={articles} pages={pages} />

        </PageSection>

        <PageSection

          title="Ebooks"

          description="Manuscript projects, chapters, covers, and exports."

          action={

            <Button variant="outline" asChild>

              <Link href="/ebooks/new">

                <Plus className="size-4" aria-hidden />

                New ebook

              </Link>

            </Button>

          }

          className="rounded-2xl border border-border/60 bg-card/40 p-6 ring-1 ring-border/50 sm:p-8"

        >

          <DashboardProjectLibrary initialProjects={projects} embedded />

        </PageSection>



        <DashboardArticlesPreview articles={articles} />

      </PageStack>

    </PageContainer>

  );

}

