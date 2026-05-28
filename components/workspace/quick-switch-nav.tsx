"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Clock, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNavRecents,
  readPinnedProjectIds,
} from "@/lib/workspace/navigation-recents";

export function QuickSwitchNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState(getNavRecents());
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setRecents(getNavRecents());
      setPinnedIds(readPinnedProjectIds());
    }
  };

  const pinnedProjects = useMemo(
    () => recents.projects.filter((item) => pinnedIds.includes(item.id)),
    [pinnedIds, recents.projects],
  );

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="hidden lg:inline-flex">
          <Clock className="size-4" aria-hidden />
          Quick switch
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {pinnedProjects.length > 0 ? (
          <>
            <DropdownMenuLabel>Pinned</DropdownMenuLabel>
            {pinnedProjects.map((item) => (
              <DropdownMenuItem key={item.id} onClick={() => router.push(item.href)}>
                {item.title}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel>Recent projects</DropdownMenuLabel>
        {recents.projects.length === 0 ? (
          <DropdownMenuItem disabled>No recent ebooks</DropdownMenuItem>
        ) : (
          recents.projects.slice(0, 6).map((item) => (
            <DropdownMenuItem key={item.id} onClick={() => router.push(item.href)}>
              {item.title}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Recent articles</DropdownMenuLabel>
        {recents.articles.length === 0 ? (
          <DropdownMenuItem disabled>No recent articles</DropdownMenuItem>
        ) : (
          recents.articles.slice(0, 6).map((item) => (
            <DropdownMenuItem key={item.id} onClick={() => router.push(item.href)}>
              {item.title}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/projects">
            <Star className="size-3.5" aria-hidden />
            Browse all projects
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
