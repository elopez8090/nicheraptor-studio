"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/library", label: "All items", exact: true },
  { href: "/library/snippets", label: "Snippets" },
  { href: "/library/frameworks", label: "Frameworks" },
  { href: "/library/prompts", label: "Prompts" },
] as const;

export function LibraryNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Content library sections"
    >
      {links.map((link) => {
        const { href, label } = link;
        const exact = "exact" in link && link.exact;
        const active = exact
          ? pathname === href
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
