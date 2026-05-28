"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { StudioWorkspaceRoot } from "@/components/workspace/studio-workspace-root";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import { cn } from "@/lib/utils";

type AppShellFrameProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

function AppShellFrame({ children, userEmail = null }: AppShellFrameProps) {
  const { appChromeHidden, setGlobalSearchOpen, setQuickCreateOpen } = useStudioWorkspace();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AppSidebar
        userEmail={userEmail}
        className={cn(appChromeHidden && "lg:hidden")}
        onGlobalSearchOpen={() => setGlobalSearchOpen(true)}
        onQuickCreateOpen={() => setQuickCreateOpen(true)}
      />
      <AppSidebar
        userEmail={userEmail}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onGlobalSearchOpen={() => setGlobalSearchOpen(true)}
        onQuickCreateOpen={() => setQuickCreateOpen(true)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:ml-0">
        <AppHeader userEmail={userEmail} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 bg-background pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}

type AppShellProps = {
  children: React.ReactNode;
  userEmail?: string | null;
};

export function AppShell({ children, userEmail = null }: AppShellProps) {
  return (
    <StudioWorkspaceRoot>
      <AppShellFrame userEmail={userEmail}>{children}</AppShellFrame>
    </StudioWorkspaceRoot>
  );
}
