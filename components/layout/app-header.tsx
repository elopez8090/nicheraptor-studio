"use client";

import Link from "next/link";
import { ArrowLeft, Menu, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AppBreadcrumbs } from "@/components/layout/app-breadcrumbs";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import { QuickSwitchNav } from "@/components/workspace/quick-switch-nav";

type AppHeaderProps = {
  userEmail?: string | null;
  className?: string;
  onOpenMobileSidebar?: () => void;
};

export function AppHeader({
  userEmail = null,
  className,
  onOpenMobileSidebar,
}: AppHeaderProps) {
  const {
    setCommandOpen,
    setGlobalSearchOpen,
    setQuickCreateOpen,
    setShortcutsOpen,
    appChromeHidden,
  } = useStudioWorkspace();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
          onClick={onOpenMobileSidebar}
        >
          <Menu aria-hidden />
        </Button>

        <div className="flex items-center gap-2 lg:hidden">
          <Sparkles className="size-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold">NicheRaptor</span>
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <div className="mt-0.5 max-w-[28rem]">
            <AppBreadcrumbs />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {appChromeHidden ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4" aria-hidden />
              Back to Dashboard
            </Link>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("hidden gap-2 md:inline-flex", appChromeHidden && "hidden")}
          onClick={() => setGlobalSearchOpen(true)}
        >
          <span>Search</span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline">
            ⌘⇧K
          </kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn("hidden gap-2 md:inline-flex", appChromeHidden && "hidden")}
          onClick={() => setCommandOpen(true)}
        >
          <span>Commands</span>
          <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium lg:inline">
            ⌘K
          </kbd>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("hidden lg:inline-flex", appChromeHidden && "hidden")}
          onClick={() => setShortcutsOpen(true)}
        >
          Shortcuts
        </Button>
        {!appChromeHidden ? <QuickSwitchNav /> : null}
        {userEmail ? (
          <p
            className="hidden max-w-[12rem] truncate text-sm text-muted-foreground md:block"
            title={userEmail}
          >
            {userEmail}
          </p>
        ) : null}
        <SignOutButton
          variant="ghost"
          size="sm"
          className={cn("hidden sm:inline-flex", appChromeHidden && "hidden")}
        />
        <Button variant="outline" size="default" className="hidden sm:inline-flex" asChild>
          <Link href="/">Home</Link>
        </Button>
        <Button
          size="default"
          type="button"
          className={cn(appChromeHidden && "hidden")}
          onClick={() => setQuickCreateOpen(true)}
        >
          Create
        </Button>
      </div>
    </header>
  );
}
