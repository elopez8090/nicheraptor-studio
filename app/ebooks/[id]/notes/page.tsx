import Link from "next/link";
import { ArrowLeft, FileText, Settings } from "lucide-react";
import { notFound } from "next/navigation";

import { ProjectNotesWorkspace } from "@/components/notes/project-notes-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { Button } from "@/components/ui/button";
import { fetchEbookWithChapters } from "@/lib/ebooks/fetch-ebook-with-chapters";

type EbookNotesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EbookNotesPage({ params }: EbookNotesPageProps) {
  const { id } = await params;
  const ebook = await fetchEbookWithChapters(id);

  if (!ebook) {
    notFound();
  }

  const chapters = ebook.chapters.map((ch) => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
  }));

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Project notes"
        title={ebook.title}
        description="Ideas, research, links, and chapter-linked sources for this ebook."
      >
        <Button variant="outline" asChild>
          <Link href="/projects">
            <ArrowLeft aria-hidden />
            Projects
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/ebooks/${id}/editor`}>
            <FileText aria-hidden />
            Editor
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/ebooks/${id}/settings`}>
            <Settings aria-hidden />
            Settings
          </Link>
        </Button>
      </PageHeader>

      <PageStack>
        <ProjectNotesWorkspace
          projectId={id}
          ebookTitle={ebook.title}
          chapters={chapters}
        />
      </PageStack>
    </PageContainer>
  );
}
