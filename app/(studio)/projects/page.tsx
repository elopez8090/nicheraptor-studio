import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { EbookProjectCard } from "@/components/ebooks/ebook-project-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fetchEbookProjects } from "@/lib/ebooks/fetch-ebook-projects";

export default async function ProjectsPage() {
  const projects = await fetchEbookProjects({ includeArchived: true });

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Library"
        title="Projects"
        description="Every ebook you create lives here. Continue writing, open the editor, or export when ready."
      >
        <Button size="lg" asChild>
          <Link href="/ebooks/new">
            <Plus aria-hidden />
            New ebook
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button size="sm" variant="default" asChild>
          <Link href="/projects">Ebooks</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/articles">Articles</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/pages">Landing Pages</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/library">Library</Link>
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/projects">Notes</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Generate your first AI outline to create a project. It will show up here with status, progress, and quick actions."
            action={{ label: "Create your first ebook", href: "/ebooks/new" }}
            secondaryAction={{ label: "Browse templates", href: "/templates" }}
          />
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <EbookProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
