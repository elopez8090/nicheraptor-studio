import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";

export default function LandingPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
