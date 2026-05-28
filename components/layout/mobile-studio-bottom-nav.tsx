"use client";

import Link from "next/link";
import { House, Plus, Search, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";

type MobileStudioBottomNavProps = {
  onQuickCreateOpen?: () => void;
  onGlobalSearchOpen?: () => void;
};

export function MobileStudioBottomNav({
  onQuickCreateOpen,
  onGlobalSearchOpen,
}: MobileStudioBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      aria-label="Quick navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 gap-1">
        <Button variant="ghost" size="sm" className="h-auto flex-col gap-1 py-2" asChild>
          <Link href="/dashboard">
            <House className="size-4" aria-hidden />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto flex-col gap-1 py-2"
          onClick={onQuickCreateOpen}
        >
          <Plus className="size-4" aria-hidden />
          <span className="text-[10px] font-medium">Create</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto flex-col gap-1 py-2"
          onClick={onGlobalSearchOpen}
        >
          <Search className="size-4" aria-hidden />
          <span className="text-[10px] font-medium">Search</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-auto flex-col gap-1 py-2" asChild>
          <Link href="/settings">
            <Settings className="size-4" aria-hidden />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </Button>
      </div>
    </nav>
  );
}
