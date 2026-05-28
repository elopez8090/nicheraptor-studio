"use client";

const ACTIVITY_KEY = "nr-workspace-activity";
const MAX_ENTRIES = 40;

export type WorkspaceActivityKind =
  | "edit_project"
  | "edit_article"
  | "open_page"
  | "export"
  | "ai_generation"
  | "note"
  | "open_article"
  | "library_item";

export type WorkspaceActivityEntry = {
  id: string;
  kind: WorkspaceActivityKind;
  title: string;
  href?: string;
  meta?: string;
  at: number;
};

function readAll(): WorkspaceActivityEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WorkspaceActivityEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: WorkspaceActivityEntry[]) {
  try {
    window.localStorage.setItem(
      ACTIVITY_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // ignore
  }
}

export function recordWorkspaceActivity(
  entry: Omit<WorkspaceActivityEntry, "at"> & { at?: number },
) {
  const at = entry.at ?? Date.now();
  const next: WorkspaceActivityEntry = { ...entry, at };
  const list = readAll().filter((e) => !(e.id === next.id && e.kind === next.kind));
  writeAll([next, ...list]);
}

export function getWorkspaceActivity(limit = 20): WorkspaceActivityEntry[] {
  return readAll().slice(0, limit);
}

export function getWorkspaceActivityByKind(
  kind: WorkspaceActivityKind,
  limit = 8,
): WorkspaceActivityEntry[] {
  return readAll()
    .filter((e) => e.kind === kind)
    .slice(0, limit);
}
