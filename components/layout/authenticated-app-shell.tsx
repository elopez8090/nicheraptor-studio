import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";

type AuthenticatedAppShellProps = {
  children: React.ReactNode;
};

export async function AuthenticatedAppShell({
  children,
}: AuthenticatedAppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <AppShell userEmail={user?.email ?? null}>{children}</AppShell>;
}
