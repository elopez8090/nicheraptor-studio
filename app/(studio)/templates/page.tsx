import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EbookTemplateCard } from "@/components/ebooks/ebook-template-card";
import { UserTemplatesSection } from "@/components/ebooks/user-templates-section";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { PageStack } from "@/components/layout/page-stack";
import { Button } from "@/components/ui/button";
import { fetchUserEbookTemplates } from "@/lib/ebooks/fetch-user-templates";
import { EBOOK_TEMPLATES } from "@/lib/ebooks/templates";

export default async function TemplatesPage() {
  const customTemplates = await fetchUserEbookTemplates();

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Starters"
        title="Ebook templates"
        description="Built-in structures plus your saved outlines from past projects."
      >
        <Button variant="outline" size="lg" className="hidden sm:inline-flex" asChild>
          <Link href="/ebooks/new">
            Custom AI outline
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </PageHeader>

      <PageStack>
        <PageSection
          title="Your personal templates"
          description="Outlines saved from past ebook projects."
        >
          <UserTemplatesSection initialTemplates={customTemplates} embedded />
        </PageSection>

        <PageSection
          title="Built-in templates"
          description="Proven chapter structures you can customize after creating a project."
        >
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {EBOOK_TEMPLATES.map((template) => (
              <li key={template.id}>
                <EbookTemplateCard template={template} />
              </li>
            ))}
          </ul>
        </PageSection>
      </PageStack>
    </PageContainer>
  );
}
