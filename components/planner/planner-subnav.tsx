"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/planner", label: "Overview" },
  { href: "/planner/topics", label: "Topics" },
  { href: "/planner/clusters", label: "Clusters" },
  { href: "/planner/roadmaps", label: "Roadmaps" },
] as const;

export function PlannerSubnav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Content planner sections"
    >
      {links.map(({ href, label }) => {
        const active =
          href === "/planner"
            ? pathname === "/planner"
            : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
