"use client";

const RECENTS_KEY = "nr-studio-nav-recents";
const PINNED_KEY = "nr-studio-pinned-projects";
const MAX_RECENTS = 12;

export type NavRecentItem = {
  id: string;
  title: string;
  href: string;
  kind: "ebook" | "article" | "landing_page";
  visitedAt: number;
};

export type NavRecentsStore = {
  projects: NavRecentItem[];
  articles: NavRecentItem[];
  pages: NavRecentItem[];
};

function readRecents(): NavRecentsStore {
  if (typeof window === "undefined") {
    return { projects: [], articles: [], pages: [] };
  }
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY);
    if (!raw) {
      return { projects: [], articles: [], pages: [] };
    }
    const parsed = JSON.parse(raw) as NavRecentsStore;
    return {
      projects: parsed.projects ?? [],
      articles: parsed.articles ?? [],
      pages: parsed.pages ?? [],
    };
  } catch {
    return { projects: [], articles: [], pages: [] };
  }
}

function writeRecents(store: NavRecentsStore) {
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function upsert(list: NavRecentItem[], item: NavRecentItem): NavRecentItem[] {
  const filtered = list.filter((entry) => entry.id !== item.id);
  return [item, ...filtered].slice(0, MAX_RECENTS);
}

export function trackNavRecent(item: Omit<NavRecentItem, "visitedAt">) {
  const store = readRecents();
  const entry: NavRecentItem = { ...item, visitedAt: Date.now() };
  if (item.kind === "ebook") {
    store.projects = upsert(store.projects, entry);
  } else if (item.kind === "article") {
    store.articles = upsert(store.articles, entry);
  } else {
    store.pages = upsert(store.pages, entry);
  }
  writeRecents(store);
}

export function getNavRecents(): NavRecentsStore {
  return readRecents();
}

export function readPinnedProjectIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PINNED_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function togglePinnedProjectId(projectId: string): string[] {
  const current = readPinnedProjectIds();
  const next = current.includes(projectId)
    ? current.filter((id) => id !== projectId)
    : [projectId, ...current].slice(0, 8);
  try {
    window.localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
