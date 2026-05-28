"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileStudioBottomNav } from "@/components/layout/mobile-studio-bottom-nav";
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
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-muted/30 lg:flex-row">
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
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AppHeader userEmail={userEmail} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} />
        <main className="min-w-0 flex-1 bg-background pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
          {children}
        </main>
        {!appChromeHidden ? (
          <MobileStudioBottomNav
            onQuickCreateOpen={() => setQuickCreateOpen(true)}
            onGlobalSearchOpen={() => setGlobalSearchOpen(true)}
          />
        ) : null}
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
