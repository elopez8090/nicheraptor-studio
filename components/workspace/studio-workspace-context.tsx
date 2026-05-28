"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { usePersistedState } from "@/lib/workspace/use-persisted-state";

type StudioWorkspaceContextValue = {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  quickCreateOpen: boolean;
  setQuickCreateOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  appChromeHidden: boolean;
  setAppChromeHidden: (hidden: boolean) => void;
  breadcrumbTail: string | null;
  setBreadcrumbTail: (label: string | null) => void;
  onboardingDismissed: boolean;
  dismissOnboarding: () => void;
};

const StudioWorkspaceContext = createContext<StudioWorkspaceContextValue | null>(
  null,
);

export function StudioWorkspaceProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [appChromeHidden, setAppChromeHidden] = useState(false);
  const [breadcrumbTail, setBreadcrumbTail] = useState<string | null>(null);
  const [onboardingDismissed, setOnboardingDismissed] = usePersistedState(
    "nr-onboarding-dismissed",
    false,
  );

  const dismissOnboarding = useCallback(() => {
    setOnboardingDismissed(true);
  }, [setOnboardingDismissed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && event.shiftKey && key === "k") {
        event.preventDefault();
        setGlobalSearchOpen((open) => !open);
        return;
      }
      if (mod && key === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
        return;
      }
      if (mod && key === "n") {
        const tag = (event.target as HTMLElement | null)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (event.target as HTMLElement)?.isContentEditable) {
          return;
        }
        event.preventDefault();
        setQuickCreateOpen((open) => !open);
        return;
      }
      if (mod && key === "/") {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({
      commandOpen,
      setCommandOpen,
      globalSearchOpen,
      setGlobalSearchOpen,
      quickCreateOpen,
      setQuickCreateOpen,
      shortcutsOpen,
      setShortcutsOpen,
      appChromeHidden,
      setAppChromeHidden,
      breadcrumbTail,
      setBreadcrumbTail,
      onboardingDismissed,
      dismissOnboarding,
    }),
    [
      commandOpen,
      globalSearchOpen,
      quickCreateOpen,
      shortcutsOpen,
      appChromeHidden,
      breadcrumbTail,
      onboardingDismissed,
      dismissOnboarding,
    ],
  );

  return (
    <StudioWorkspaceContext.Provider value={value}>
      {children}
    </StudioWorkspaceContext.Provider>
  );
}

export function useStudioWorkspace() {
  const ctx = useContext(StudioWorkspaceContext);
  if (!ctx) {
    throw new Error("useStudioWorkspace must be used within StudioWorkspaceProvider");
  }
  return ctx;
}

export function useOptionalStudioWorkspace() {
  return useContext(StudioWorkspaceContext);
}
