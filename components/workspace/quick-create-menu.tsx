"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  FlaskConical,
  Lightbulb,
  StickyNote,
  FileCode,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import { cn } from "@/lib/utils";

const actions = [
  {
    id: "ebook",
    label: "New Ebook (guided)",
    href: "/create",
    icon: BookOpen,
  },
  {
    id: "article",
    label: "New Article (guided)",
    href: "/create",
    icon: FileText,
  },
  {
    id: "landing-page",
    label: "New Landing Page (guided)",
    href: "/create",
    icon: FileText,
  },
  {
    id: "note",
    label: "New Note",
    href: "/projects",
    hint: "Open a project → Notes",
    icon: StickyNote,
  },
  {
    id: "snippet",
    label: "New Snippet",
    href: "/library/snippets",
    icon: FileCode,
  },
  {
    id: "idea",
    label: "Generate Idea",
    href: "/planner/topics",
    icon: Lightbulb,
  },
  {
    id: "research",
    label: "Start Research",
    href: "/projects",
    hint: "Open ebook editor → Research panel",
    icon: FlaskConical,
  },
] as const;

export function QuickCreateMenu() {
  const { quickCreateOpen, setQuickCreateOpen } = useStudioWorkspace();
  const router = useRouter();

  return (
    <Dialog open={quickCreateOpen} onOpenChange={setQuickCreateOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md" showCloseButton>
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle>Quick create</DialogTitle>
          <DialogDescription>
            Start something new ·{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘N</kbd>
          </DialogDescription>
        </DialogHeader>
        <ul className="grid gap-1 p-2 sm:grid-cols-2">
          {actions.map((action) => (
            <li key={action.id}>
              <button
                type="button"
                className={cn(
                  "flex h-full w-full flex-col items-start gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-3 text-left text-sm transition-colors hover:bg-muted",
                )}
                onClick={() => {
                  setQuickCreateOpen(false);
                  router.push(action.href);
                }}
              >
                <action.icon className="size-5 text-primary" aria-hidden />
                <span className="font-medium">{action.label}</span>
                {"hint" in action && action.hint ? (
                  <span className="text-xs text-muted-foreground">{action.hint}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
