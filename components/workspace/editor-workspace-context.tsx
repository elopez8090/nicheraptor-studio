"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePersistedState } from "@/lib/workspace/use-persisted-state";
import { patchWorkspaceMemory } from "@/lib/workspace/workspace-memory";

export type EditorWidthPreset = "narrow" | "default" | "wide" | "full";

type EditorWorkspacePrefs = {
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  focusMode: boolean;
  centeredManuscript: boolean;
  editorWidth: EditorWidthPreset;
};

type EditorWorkspaceContextValue = EditorWorkspacePrefs & {
  toggleLeft: () => void;
  toggleRight: () => void;
  setFocusMode: (value: boolean) => void;
  setCenteredManuscript: (value: boolean) => void;
  setEditorWidth: (value: EditorWidthPreset) => void;
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
  registerDirty: (dirty: boolean) => void;
  isDirty: boolean;
  requestSave: () => void;
  openToolTab: (tabId: string) => void;
  setRequestSaveHandler: (handler: (() => void) | null) => void;
  setOpenToolTabHandler: (handler: ((tabId: string) => void) | null) => void;
};

const defaultPrefs: EditorWorkspacePrefs = {
  leftCollapsed: false,
  rightCollapsed: false,
  focusMode: false,
  centeredManuscript: true,
  editorWidth: "default",
};

const EditorWorkspaceContext = createContext<EditorWorkspaceContextValue | null>(
  null,
);

export function EditorWorkspaceProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = usePersistedState<EditorWorkspacePrefs>(
    "nr-editor-workspace-prefs",
    defaultPrefs,
  );
  const [isFullscreen, setFullscreenState] = usePersistedState<boolean>(
    "nr-editor-fullscreen",
    false,
  );
  const [isDirty, setIsDirty] = useState(false);

  const [requestSaveHandler, setRequestSaveHandler] = useState<(() => void) | null>(null);
  const [openToolTabHandler, setOpenToolTabHandler] = useState<((tabId: string) => void) | null>(null);

  const patch = useCallback(
    (partial: Partial<EditorWorkspacePrefs>) => {
      setPrefs((prev) => ({ ...prev, ...partial }));
    },
    [setPrefs],
  );

  const value = useMemo<EditorWorkspaceContextValue>(
    () => ({
      ...prefs,
      toggleLeft: () => patch({ leftCollapsed: !prefs.leftCollapsed }),
      toggleRight: () => patch({ rightCollapsed: !prefs.rightCollapsed }),
      setFocusMode: (focusMode) => {
        patch({ focusMode });
        patchWorkspaceMemory({ focusModePreferred: focusMode });
      },
      setCenteredManuscript: (centeredManuscript) => patch({ centeredManuscript }),
      setEditorWidth: (editorWidth) => patch({ editorWidth }),
      isFullscreen,
      setFullscreen: setFullscreenState,
      registerDirty: setIsDirty,
      isDirty,
      requestSave: () => requestSaveHandler?.(),
      openToolTab: (tabId) => openToolTabHandler?.(tabId),
      setRequestSaveHandler,
      setOpenToolTabHandler,
    }),
    [
      prefs,
      patch,
      isFullscreen,
      setFullscreenState,
      isDirty,
      setIsDirty,
      requestSaveHandler,
      openToolTabHandler,
    ],
  );

  return (
    <EditorWorkspaceContext.Provider value={value}>
      {children}
    </EditorWorkspaceContext.Provider>
  );
}

export function useEditorWorkspace() {
  const ctx = useContext(EditorWorkspaceContext);
  if (!ctx) {
    throw new Error("useEditorWorkspace must be used within EditorWorkspaceProvider");
  }
  return ctx;
}

export function useOptionalEditorWorkspace() {
  return useContext(EditorWorkspaceContext);
}

export function editorWidthClass(preset: EditorWidthPreset): string {
  switch (preset) {
    case "narrow":
      return "max-w-2xl";
    case "wide":
      return "max-w-5xl";
    case "full":
      return "max-w-none";
    default:
      return "max-w-3xl";
  }
}
