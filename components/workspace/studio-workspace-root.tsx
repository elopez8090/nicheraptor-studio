"use client";

import { ToastProvider } from "@/components/providers/toast-provider";
import { CommandPalette } from "@/components/workspace/command-palette";
import { GlobalSearchDialog } from "@/components/workspace/global-search-dialog";
import { KeyboardShortcutsModal } from "@/components/workspace/keyboard-shortcuts-modal";
import { OnboardingModal } from "@/components/workspace/onboarding-modal";
import { QuickCreateMenu } from "@/components/workspace/quick-create-menu";
import { StudioWorkspaceProvider } from "@/components/workspace/studio-workspace-context";

type StudioWorkspaceRootProps = {
  children: React.ReactNode;
};

export function StudioWorkspaceRoot({ children }: StudioWorkspaceRootProps) {
  return (
    <StudioWorkspaceProvider>
      <ToastProvider>
        {children}
        <CommandPalette />
        <GlobalSearchDialog />
        <QuickCreateMenu />
        <KeyboardShortcutsModal />
        <OnboardingModal />
      </ToastProvider>
    </StudioWorkspaceProvider>
  );
}
