"use client";

const MEMORY_KEY = "nr-workspace-memory";

export type WorkspaceMemoryState = {
  lastEditorPath: string | null;
  sidebarCollapsed: boolean;
  dashboardCompact: boolean;
  dashboardHiddenSections: string[];
  editorToolTabs: Record<string, string>;
  focusModePreferred: boolean;
  openDocumentTabs: Record<string, string[]>;
};

const defaultMemory: WorkspaceMemoryState = {
  lastEditorPath: null,
  sidebarCollapsed: false,
  dashboardCompact: false,
  dashboardHiddenSections: [],
  editorToolTabs: {},
  focusModePreferred: false,
  openDocumentTabs: {},
};

function readMemory(): WorkspaceMemoryState {
  if (typeof window === "undefined") {
    return defaultMemory;
  }
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) {
      return defaultMemory;
    }
    const parsed = JSON.parse(raw) as Partial<WorkspaceMemoryState>;
    return { ...defaultMemory, ...parsed };
  } catch {
    return defaultMemory;
  }
}

function writeMemory(partial: Partial<WorkspaceMemoryState>) {
  const next = { ...readMemory(), ...partial };
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function getWorkspaceMemory(): WorkspaceMemoryState {
  return readMemory();
}

export function patchWorkspaceMemory(partial: Partial<WorkspaceMemoryState>) {
  return writeMemory(partial);
}

export function rememberEditorToolTab(scopeKey: string, tabId: string) {
  const mem = readMemory();
  writeMemory({
    editorToolTabs: { ...mem.editorToolTabs, [scopeKey]: tabId },
  });
}

export function getRememberedEditorToolTab(scopeKey: string): string | null {
  return readMemory().editorToolTabs[scopeKey] ?? null;
}

export function rememberLastEditorPath(path: string) {
  writeMemory({ lastEditorPath: path });
}
