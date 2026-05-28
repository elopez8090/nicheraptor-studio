import { ManuscriptEditorWorkspace } from "@/components/ebooks/manuscript-editor-workspace";
import { buildManuscript } from "@/lib/ebooks/build-manuscript";
import { fetchEbookWithChapters } from "@/lib/ebooks/fetch-ebook-with-chapters";
import { isLikelyId } from "@/lib/navigation/route-params";
import { notFound } from "next/navigation";

type EbookEditorPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EbookEditorPage({ params }: EbookEditorPageProps) {
  const { id } = await params;
  if (!isLikelyId(id)) {
    notFound();
  }
  const ebook = await fetchEbookWithChapters(id);

  if (!ebook) {
    notFound();
  }

  const manuscript = buildManuscript(ebook);

  return <ManuscriptEditorWorkspace ebook={ebook} manuscript={manuscript} />;
}
