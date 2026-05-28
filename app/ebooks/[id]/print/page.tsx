import Link from "next/link";
import { notFound } from "next/navigation";

import { ManuscriptPrintPageClient } from "@/components/ebooks/manuscript-print-page-client";
import { ManuscriptPrintView } from "@/components/ebooks/manuscript-print-view";
import { Button } from "@/components/ui/button";
import { buildManuscript } from "@/lib/ebooks/build-manuscript";
import { fetchManuscriptPrintOptionsForProject } from "@/lib/ebooks/fetch-project-export-settings";
import { fetchEbookWithChapters } from "@/lib/ebooks/fetch-ebook-with-chapters";

type EbookPrintPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EbookPrintPage({ params }: EbookPrintPageProps) {
  const { id } = await params;
  const ebook = await fetchEbookWithChapters(id);

  if (!ebook) {
    notFound();
  }

  const manuscript = buildManuscript(ebook, { generatedChaptersOnly: true });
  const printOptions = await fetchManuscriptPrintOptionsForProject(id);

  if (manuscript.chapters.length === 0) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-xl font-semibold">Nothing to print yet</h1>
        <p className="text-sm text-muted-foreground">
          Generate and save at least one chapter before exporting a PDF.
        </p>
        <Button asChild>
          <Link href={`/ebooks/${id}/editor`}>Back to editor</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <ManuscriptPrintPageClient />
      <ManuscriptPrintView
        projectId={id}
        manuscript={manuscript}
        printOptions={printOptions}
      />
    </>
  );
}
