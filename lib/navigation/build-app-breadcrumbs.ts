export type AppBreadcrumbItem = {
  href?: string;
  label: string;
};

const LIBRARY_SECTIONS: Record<string, string> = {
  "/library/snippets": "Snippets",
  "/library/frameworks": "Frameworks",
  "/library/prompts": "Prompts",
};

const PLANNER_SECTIONS: Record<string, string> = {
  "/planner/topics": "Topics",
  "/planner/clusters": "Clusters",
  "/planner/roadmaps": "Roadmaps",
};

const PUBLISHING_SECTIONS: Record<string, string> = {
  "/publishing/queue": "Queue",
  "/publishing/history": "History",
};

export function buildAppBreadcrumbs(
  pathname: string,
  tailOverride?: string | null,
): AppBreadcrumbItem[] {
  const crumbs: AppBreadcrumbItem[] = [{ href: "/dashboard", label: "Dashboard" }];

  if (pathname === "/dashboard") {
    return [{ label: "Dashboard" }];
  }

  const push = (href: string | undefined, label: string) => {
    crumbs.push(href ? { href, label } : { label });
  };

  if (pathname === "/projects" || pathname.startsWith("/ebooks/") || pathname === "/ebooks/new") {
    push("/projects", "Ebooks");
    if (pathname === "/ebooks/new") {
      push(undefined, "New ebook");
    } else if (pathname.startsWith("/ebooks/")) {
      const rest = pathname.replace(/^\/ebooks\/[^/]+/, "");
      push(undefined, tailOverride?.trim() || "My ebook");
      if (rest === "/editor") push(undefined, "Editor");
      else if (rest === "/settings") push(undefined, "Settings");
      else if (rest === "/notes") push(undefined, "Notes");
      else if (rest === "/chapters") push(undefined, "Chapters");
      else if (rest === "/print") push(undefined, "Export");
    }
    return crumbs;
  }

  if (pathname === "/articles" || pathname.startsWith("/articles/")) {
    push("/articles", "Articles");
    if (pathname === "/articles/new") push(undefined, "New");
    else if (pathname.endsWith("/editor")) {
      push(undefined, tailOverride?.trim() || "Editor");
    }
    return crumbs;
  }

  if (pathname === "/pages" || pathname.startsWith("/pages/")) {
    push("/pages", "Landing Pages");
    if (pathname === "/pages/new") push(undefined, "New");
    else if (pathname.endsWith("/editor")) {
      push(undefined, tailOverride?.trim() || "Page");
      push(undefined, "Editor");
    }
    return crumbs;
  }

  if (pathname === "/planner" || pathname.startsWith("/planner/")) {
    push("/planner", "Planner");
    const section = PLANNER_SECTIONS[pathname];
    if (section) push(undefined, section);
    return crumbs;
  }

  if (pathname === "/publishing" || pathname.startsWith("/publishing/")) {
    push("/publishing", "Publishing");
    const section = PUBLISHING_SECTIONS[pathname];
    if (section) push(undefined, section);
    return crumbs;
  }

  if (pathname === "/library" || pathname.startsWith("/library/")) {
    push("/library", "Library");
    const section = LIBRARY_SECTIONS[pathname];
    if (section) push(undefined, section);
    return crumbs;
  }

  if (pathname === "/templates" || pathname.startsWith("/templates/")) {
    push("/templates", "Templates");
    return crumbs;
  }

  if (pathname === "/exports") {
    push("/exports", "Exports");
    return crumbs;
  }

  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    push("/settings", "Settings");
    return crumbs;
  }

  push(undefined, tailOverride?.trim() || "Studio");
  return crumbs;
}
