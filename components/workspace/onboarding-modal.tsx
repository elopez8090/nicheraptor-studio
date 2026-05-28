"use client";

import Link from "next/link";
import { BookOpen, FileText, Import, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";

const steps = [
  {
    icon: BookOpen,
    title: "Create an ebook",
    description: "Outline chapters with AI, then write in the manuscript editor.",
    href: "/ebooks/new",
    label: "New ebook",
  },
  {
    icon: FileText,
    title: "Create an article",
    description: "Draft SEO-ready posts with AI tools and a focused writing column.",
    href: "/articles/new",
    label: "New article",
  },
  {
    icon: Sparkles,
    title: "Start from a template",
    description: "Pick a proven structure for your niche and audience.",
    href: "/templates",
    label: "Browse templates",
  },
  {
    icon: Import,
    title: "Import an idea",
    description: "Turn notes or a rough concept into a structured project.",
    href: "/ebooks/new",
    label: "Start from idea",
  },
] as const;

export function OnboardingModal() {
  const { onboardingDismissed, dismissOnboarding } = useStudioWorkspace();

  return (
    <Dialog open={!onboardingDismissed} onOpenChange={(open) => !open && dismissOnboarding()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton={false}>
        <DialogHeader className="space-y-3 border-b border-border/60 bg-muted/20 px-6 py-6">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            Welcome to NicheRaptor Studio
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            What do you want to create? Pick a starting point — you can always switch later from
            the dashboard or command palette (
            <kbd className="rounded border bg-background px-1.5 py-0.5 text-xs">⌘K</kbd>).
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-3 px-6 py-6 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.title}>
              <Link
                href={step.href}
                onClick={dismissOnboarding}
                className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.icon className="size-5" aria-hidden />
                </div>
                <p className="font-semibold tracking-tight">{step.title}</p>
                <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <span className="mt-3 text-sm font-medium text-primary group-hover:underline">
                  {step.label} →
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex justify-end border-t border-border/60 bg-muted/15 px-6 py-4">
          <Button type="button" variant="ghost" onClick={dismissOnboarding}>
            <X className="size-4" aria-hidden />
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
