"use client";

import { Pin } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  isPinnedWorkspaceItem,
  togglePinnedWorkspaceItem,
  type PinnedItemKind,
} from "@/lib/workspace/workspace-favorites";
import { cn } from "@/lib/utils";

type PinWorkspaceItemButtonProps = {
  kind: PinnedItemKind;
  id: string;
  title: string;
  href: string;
  className?: string;
  size?: "sm" | "icon";
};

export function PinWorkspaceItemButton({
  kind,
  id,
  title,
  href,
  className,
  size = "sm",
}: PinWorkspaceItemButtonProps) {
  const [pinned, setPinned] = useState(() => isPinnedWorkspaceItem(kind, id));

  return (
    <Button
      type="button"
      variant="ghost"
      size={size === "icon" ? "icon" : "sm"}
      className={cn(className)}
      aria-pressed={pinned}
      title={pinned ? "Unpin" : "Pin to favorites"}
      onClick={() => {
        const next = togglePinnedWorkspaceItem({ kind, id, title, href });
        setPinned(next);
      }}
    >
      <Pin
        className={cn("size-4", pinned && "fill-current text-primary")}
        aria-hidden
      />
      {size === "icon" ? (
        <span className="sr-only">{pinned ? "Unpin" : "Pin"}</span>
      ) : pinned ? (
        "Pinned"
      ) : (
        "Pin"
      )}
    </Button>
  );
}
