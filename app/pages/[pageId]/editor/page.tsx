import { notFound } from "next/navigation";
import { LandingPageEditorWorkspace } from "@/components/landing-pages/landing-page-editor-workspace";
import { fetchLandingPage } from "@/lib/landing-pages/fetch-landing-page";

type LandingPageEditorPageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function LandingPageEditorPage({ params }: LandingPageEditorPageProps) {
  const { pageId } = await params;
  const page = await fetchLandingPage(pageId);
  if (!page) notFound();
  return <LandingPageEditorWorkspace page={page} />;
}
