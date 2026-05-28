"use client";

import { Pin } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  readPinnedProjectIds,
  togglePinnedProjectId,
} from "@/lib/workspace/navigation-recents";
import { cn } from "@/lib/utils";

type PinProjectButtonProps = {
  projectId: string;
  className?: string;
};

export function PinProjectButton({ projectId, className }: PinProjectButtonProps) {
  const [pinned, setPinned] = useState(() => readPinnedProjectIds().includes(projectId));

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(className)}
      aria-pressed={pinned}
      onClick={() => {
        const next = togglePinnedProjectId(projectId);
        setPinned(next.includes(projectId));
      }}
    >
      <Pin className={cn("size-4", pinned && "fill-current text-primary")} aria-hidden />
      {pinned ? "Pinned" : "Pin"}
    </Button>
  );
}
