import { LibraryNav } from "@/components/content-library/library-nav";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";

export default function ContentLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Reusable content"
        title="Content library"
        description="Snippets, writing frameworks, AI prompts, and reusable sections for ebooks and articles."
      />
      <div className="mt-6">
        <LibraryNav />
      </div>
      <PageStack className="mt-8">{children}</PageStack>
    </PageContainer>
  );
}
