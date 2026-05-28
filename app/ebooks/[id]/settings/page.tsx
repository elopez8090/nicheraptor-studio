import Link from "next/link";
import { ArrowLeft, StickyNote } from "lucide-react";

import { EbookProjectSettingsForm } from "@/components/ebooks/ebook-project-settings-form";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { Button } from "@/components/ui/button";
import { fetchEbookProjectSettings } from "@/lib/ebooks/project-settings";
import { notFound } from "next/navigation";

type EbookSettingsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EbookSettingsPage({ params }: EbookSettingsPageProps) {
  const { id } = await params;
  const settings = await fetchEbookProjectSettings(id);

  if (!settings) {
    notFound();
  }

  return (
    <PageContainer size="default">
      <PageHeader
        eyebrow="Project settings"
        title={settings.title}
        description="Metadata, writing preferences, export layout, and project actions."
      >
        <Button variant="outline" asChild>
          <Link href={`/ebooks/${id}/editor`}>
            <ArrowLeft aria-hidden />
            Editor
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/ebooks/${id}/notes`}>
            <StickyNote aria-hidden />
            Notes
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/ebooks/${id}/chapters`}>Chapters</Link>
        </Button>
      </PageHeader>

      <PageStack>
        <EbookProjectSettingsForm projectId={id} />
      </PageStack>
    </PageContainer>
  );
}
