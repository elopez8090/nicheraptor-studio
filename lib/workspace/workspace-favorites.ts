"use client";

const PINNED_ITEMS_KEY = "nr-studio-pinned-items";

export type PinnedItemKind =
  | "project"
  | "article"
  | "note"
  | "snippet"
  | "framework"
  | "template"
  | "library";

export type PinnedWorkspaceItem = {
  key: string;
  kind: PinnedItemKind;
  id: string;
  title: string;
  href: string;
  pinnedAt: number;
};

function itemKey(kind: PinnedItemKind, id: string) {
  return `${kind}:${id}`;
}

function readPinned(): PinnedWorkspaceItem[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(PINNED_ITEMS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PinnedWorkspaceItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePinned(items: PinnedWorkspaceItem[]) {
  try {
    window.localStorage.setItem(
      PINNED_ITEMS_KEY,
      JSON.stringify(items.slice(0, 24)),
    );
  } catch {
    // ignore
  }
}

export function getPinnedWorkspaceItems(): PinnedWorkspaceItem[] {
  return readPinned().sort((a, b) => b.pinnedAt - a.pinnedAt);
}

export function isPinnedWorkspaceItem(kind: PinnedItemKind, id: string): boolean {
  const key = itemKey(kind, id);
  return readPinned().some((item) => item.key === key);
}

export function togglePinnedWorkspaceItem(
  item: Omit<PinnedWorkspaceItem, "key" | "pinnedAt">,
): boolean {
  const key = itemKey(item.kind, item.id);
  const current = readPinned();
  const exists = current.some((p) => p.key === key);
  if (exists) {
    writePinned(current.filter((p) => p.key !== key));
    return false;
  }
  writePinned([
    { ...item, key, pinnedAt: Date.now() },
    ...current.filter((p) => p.key !== key),
  ]);
  return true;
}
