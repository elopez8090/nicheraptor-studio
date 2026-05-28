import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

type MarketingShellProps = {
  children: React.ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="relative flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.15_264/0.12),transparent)]"
        aria-hidden
      />
      <header className="relative z-10 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <Sparkles className="size-4" aria-hidden />
            </div>
            <span className="truncate text-sm font-semibold tracking-tight sm:text-base">
              NicheRaptor Studio
            </span>
          </Link>
          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-3">
            <Button variant="ghost" size="sm" className="px-2 sm:px-4" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="ghost" size="sm" className="hidden px-2 sm:inline-flex sm:px-4" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button size="sm" className="px-2 sm:px-4" asChild>
              <Link href="/ebooks/new">
                <span className="hidden sm:inline">Start creating</span>
                <span className="sm:hidden">Create</span>
              </Link>
            </Button>
          </nav>
        </div>
      </header>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
