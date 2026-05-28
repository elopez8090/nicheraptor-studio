import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form";

export default function SettingsPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Personal workspace"
        title="Settings"
        description="Defaults for new ebooks, exports, and how your name appears in PDFs."
      />
      <WorkspaceSettingsForm />
    </PageContainer>
  );
}
