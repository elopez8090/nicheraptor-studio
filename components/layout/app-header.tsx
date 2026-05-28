"use client";

import Link from "next/link";
import { ArrowLeft, Menu, Plus } from "lucide-react";

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
        "sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-background/80 px-3 backdrop-blur-xl sm:h-16 sm:gap-4 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label="Open navigation menu"
          onClick={onOpenMobileSidebar}
        >
          <Menu aria-hidden />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="hidden text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
            Workspace
          </p>
          <div className="mt-0.5 min-w-0 max-w-full sm:max-w-[28rem]">
            <AppBreadcrumbs />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {appChromeHidden ? (
          <Button variant="outline" size="sm" className="max-sm:px-2" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="size-4 sm:mr-1" aria-hidden />
              <span className="sm:hidden">Back</span>
              <span className="hidden sm:inline">Back to Dashboard</span>
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
          className={cn("max-sm:size-9 max-sm:px-0", appChromeHidden && "hidden")}
          onClick={() => setQuickCreateOpen(true)}
        >
          <Plus className="size-4 sm:mr-0" aria-hidden />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </div>
    </header>
  );
}
