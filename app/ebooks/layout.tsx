import { AuthenticatedAppShell } from "@/components/layout/authenticated-app-shell";

export default function EbooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedAppShell>{children}</AuthenticatedAppShell>;
}
