import Link from "next/link";
import { ArrowLeft, FileText, Settings, StickyNote } from "lucide-react";

import { EbookChaptersWorkspace } from "@/components/ebooks/ebook-chapters-workspace";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fetchEbookWithChapters } from "@/lib/ebooks/fetch-ebook-with-chapters";
import { notFound } from "next/navigation";

type EbookChaptersPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EbookChaptersPage({ params }: EbookChaptersPageProps) {
  const { id } = await params;
  const ebook = await fetchEbookWithChapters(id);

  if (!ebook) {
    notFound();
  }

  const generatedCount = ebook.chapters.filter(
    (c) => c.status === "generated",
  ).length;

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Chapter workspace"
        title={ebook.title}
        description={`${generatedCount} of ${ebook.chapters.length} chapters generated · ${ebook.audience}`}
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
          <Link href={`/ebooks/${id}/notes`}>
            <StickyNote aria-hidden />
            Notes
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/ebooks/${id}/settings`}>
            <Settings aria-hidden />
            Settings
          </Link>
        </Button>
      </PageHeader>

      <div className="mt-10">
        <EbookChaptersWorkspace initialEbook={ebook} />
      </div>
    </PageContainer>
  );
}
