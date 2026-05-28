"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDownIcon,
  ChevronRightIcon,
  Download,
  FileText,
  Layers,
  LayoutDashboard,
  Lightbulb,
  LayoutTemplate,
  Library,
  Map,
  PanelsTopLeft,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  TimerReset,
  X,
} from "lucide-react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
import { getNavRecents } from "@/lib/workspace/navigation-recents";
import { getPinnedWorkspaceItems } from "@/lib/workspace/workspace-favorites";
import { cn } from "@/lib/utils";

type SidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  aliases?: string[];
};

type SidebarGroup = {
  id: string;
  label: string;
  items: SidebarItem[];
};

const topLevelItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Ebooks", icon: BookOpen, aliases: ["/ebooks"] },
  {
    href: "/create",
    label: "Create",
    icon: Plus,
    aliases: ["/articles/new", "/pages/new", "/create"],
  },
] as const;

const groupedSections: SidebarGroup[] = [
  {
    id: "content",
    label: "Content",
    items: [
      { href: "/projects", label: "Ebooks", icon: BookOpen, aliases: ["/ebooks"] },
      { href: "/articles", label: "Articles", icon: FileText },
      { href: "/pages", label: "Landing Pages", icon: PanelsTopLeft },
    ],
  },
  {
    id: "strategy",
    label: "Strategy",
    items: [
      { href: "/planner", label: "Planner", icon: Map },
      { href: "/planner/topics", label: "Research", icon: Lightbulb, aliases: ["/research"] },
    ],
  },
  {
    id: "assets",
    label: "Assets",
    items: [
      { href: "/library", label: "Library", icon: Library },
      { href: "/templates", label: "Templates", icon: LayoutTemplate },
    ],
  },
  {
    id: "workflow",
    label: "Workflow",
    items: [
      { href: "/publishing", label: "Publishing", icon: Send },
      { href: "/publishing/queue", label: "Queue", icon: Layers },
    ],
  },
] as const;

const utilityItems: SidebarItem[] = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/exports", label: "Export", icon: Download },
] as const;

const quickCreateItems = [
  { href: "/create", label: "Ebook", icon: BookOpen },
  { href: "/create", label: "Article", icon: FileText },
  { href: "/create", label: "Landing Page", icon: PanelsTopLeft },
  { href: "/projects", label: "Note", icon: FileText },
  { href: "/library/snippets", label: "Snippet", icon: Layers },
] as const;

function isNavActive(pathname: string, item: SidebarItem) {
  const href = item.href;
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  const checks = [href, ...(item.aliases ?? [])];
  for (const check of checks) {
    if (pathname === check || pathname.startsWith(`${check}/`)) {
      return true;
    }
  }
  return false;
}

function getContextualNav(pathname: string): SidebarItem[] {
  const ebookMatch = pathname.match(/^\/ebooks\/([^/]+)/);
  if (ebookMatch) {
    const ebookId = ebookMatch[1];
    return [
      { href: `/ebooks/${ebookId}/editor`, label: "Editor", icon: FileText },
      { href: `/ebooks/${ebookId}/notes`, label: "Notes", icon: Layers },
      { href: `/ebooks/${ebookId}/settings`, label: "Settings", icon: Settings },
      { href: `/ebooks/${ebookId}/print`, label: "Export", icon: Download },
      { href: `/ebooks/${ebookId}/editor`, label: "Research", icon: Search },
    ];
  }
  const articleMatch = pathname.match(/^\/articles\/([^/]+)/);
  if (articleMatch) {
    const articleId = articleMatch[1];
    return [
      { href: `/articles/${articleId}/editor`, label: "Editor", icon: FileText },
      { href: "/library/snippets", label: "Notes", icon: Layers },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/exports", label: "Export", icon: Download },
      { href: "/planner/topics", label: "Research", icon: Search },
    ];
  }
  const pageMatch = pathname.match(/^\/pages\/([^/]+)/);
  if (pageMatch) {
    const pageId = pageMatch[1];
    return [
      { href: `/pages/${pageId}/editor`, label: "Editor", icon: FileText },
      { href: "/library/snippets", label: "Notes", icon: Layers },
      { href: "/settings", label: "Settings", icon: Settings },
      { href: "/exports", label: "Export", icon: Download },
      { href: "/planner/topics", label: "Research", icon: Search },
    ];
  }
  return [];
}

type AppSidebarProps = {
  userEmail?: string | null;
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onGlobalSearchOpen?: () => void;
  onQuickCreateOpen?: () => void;
};

export function AppSidebar({
  userEmail = null,
  className,
  mobileOpen = false,
  onMobileClose,
  onGlobalSearchOpen,
  onQuickCreateOpen,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    content: true,
    strategy: true,
    assets: true,
    workflow: true,
    quickCreate: true,
    contextual: true,
    favorites: true,
    recents: true,
  });
  const favorites = useMemo(() => getPinnedWorkspaceItems().slice(0, 8), [pathname, mobileOpen]);
  const recents = useMemo(() => {
    const store = getNavRecents();
    return [...store.projects, ...store.articles, ...store.pages]
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, 8);
  }, [pathname, mobileOpen]);
  const contextualNav = getContextualNav(pathname);
  const isMobile = !!onMobileClose;

  const shellClassName = cn(
    "w-[292px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",
    isMobile
      ? cn(
          "fixed inset-y-0 left-0 z-50 flex transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )
      : "hidden lg:flex",
    className,
  );

  const renderNavItem = (item: SidebarItem, compact = false) => {
    const Icon = item.icon;
    const active = isNavActive(pathname, item);
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={isMobile ? onMobileClose : undefined}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-[background-color,color,transform] duration-200",
          compact ? "text-[13px]" : "text-[15px]",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border/50"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground active:scale-[0.99]",
        )}
      >
        <Icon className="size-[17px] shrink-0 opacity-90" aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {isMobile && mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation"
          onClick={onMobileClose}
        />
      ) : null}
      <aside className={shellClassName}>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/20">
          <Sparkles className="size-4" aria-hidden />
        </div>
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground"
          >
            NicheRaptor Studio
          </Link>
          <p className="truncate text-xs text-sidebar-foreground/60">AI ebooks</p>
        </div>
        {isMobile ? (
          <Button variant="ghost" size="icon" className="ml-auto" onClick={onMobileClose}>
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close sidebar</span>
          </Button>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-3 overflow-y-auto p-3" aria-label="Main">
        <button
          type="button"
          onClick={() => toggleGroup("quickCreate")}
          className="flex items-center justify-between rounded-xl border border-sidebar-border/70 bg-sidebar-accent/20 px-3 py-2 text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Plus className="size-4" aria-hidden />
            + Create
          </span>
          {openGroups.quickCreate ? <ChevronDownIcon className="size-4" aria-hidden /> : <ChevronRightIcon className="size-4" aria-hidden />}
        </button>
        {openGroups.quickCreate ? (
          <div className="space-y-1 pl-2">
            {quickCreateItems.map((item) => renderNavItem(item, true))}
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          className="justify-start border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => {
            onGlobalSearchOpen?.();
            onMobileClose?.();
          }}
        >
          <Search className="size-4" aria-hidden />
          Workspace search
        </Button>

        <div className="space-y-1">
          {topLevelItems.map((item) => renderNavItem(item))}
        </div>

        {groupedSections.map((group) => (
          <section key={group.id} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            >
              {group.label}
              {openGroups[group.id] ? <ChevronDownIcon className="size-3.5" aria-hidden /> : <ChevronRightIcon className="size-3.5" aria-hidden />}
            </button>
            {openGroups[group.id] ? (
              <div className="space-y-1">{group.items.map((item) => renderNavItem(item))}</div>
            ) : null}
          </section>
        ))}

        {contextualNav.length > 0 ? (
          <section className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup("contextual")}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
            >
              Editor Workspace
              {openGroups.contextual ? <ChevronDownIcon className="size-3.5" aria-hidden /> : <ChevronRightIcon className="size-3.5" aria-hidden />}
            </button>
            {openGroups.contextual ? (
              <div className="space-y-1">{contextualNav.map((item) => renderNavItem(item, true))}</div>
            ) : null}
          </section>
        ) : null}

        <section className="space-y-1">
          <button
            type="button"
            onClick={() => toggleGroup("favorites")}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
          >
            Favorites
            {openGroups.favorites ? <ChevronDownIcon className="size-3.5" aria-hidden /> : <ChevronRightIcon className="size-3.5" aria-hidden />}
          </button>
          {openGroups.favorites ? (
            <div className="space-y-1">
              {favorites.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-sidebar-foreground/60">Pin items to see them here.</p>
              ) : (
                favorites.map((item) =>
                  renderNavItem({
                    href: item.href,
                    label: item.title,
                    icon: Star,
                  }, true),
                )
              )}
            </div>
          ) : null}
        </section>

        <section className="space-y-1">
          <button
            type="button"
            onClick={() => toggleGroup("recents")}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground"
          >
            Recent
            {openGroups.recents ? <ChevronDownIcon className="size-3.5" aria-hidden /> : <ChevronRightIcon className="size-3.5" aria-hidden />}
          </button>
          {openGroups.recents ? (
            <div className="space-y-1">
              {recents.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-sidebar-foreground/60">Open ebooks and articles to build this list.</p>
              ) : (
                recents.map((item) =>
                  renderNavItem({
                    href: item.href,
                    label: item.title,
                    icon: TimerReset,
                  }, true),
                )
              )}
            </div>
          ) : null}
        </section>

        <section className="space-y-1 border-t border-sidebar-border/60 pt-2">
          {utilityItems.map((item) => renderNavItem(item))}
        </section>
      </nav>

      <div className="border-t border-sidebar-border p-4 space-y-3">
        {userEmail ? (
          <div className="min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground/70">Signed in as</p>
            <p className="truncate text-sm font-medium text-sidebar-foreground" title={userEmail}>
              {userEmail}
            </p>
          </div>
        ) : null}
        <SignOutButton
          variant="outline"
          size="sm"
          className="w-full border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent"
        />
        <p className="text-xs leading-relaxed text-sidebar-foreground/50">
          AI-powered ebooks & digital products
        </p>
      </div>
      </aside>
    </>
  );
}
