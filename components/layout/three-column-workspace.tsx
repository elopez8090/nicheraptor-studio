"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  editorWidthClass,
  useOptionalEditorWorkspace,
} from "@/components/workspace/editor-workspace-context";
import { useOptionalStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import { cn } from "@/lib/utils";

type ThreeColumnWorkspaceProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  headerActions?: React.ReactNode;
};

export function ThreeColumnWorkspace({
  left,
  center,
  right,
  className,
  header,
  headerActions,
}: ThreeColumnWorkspaceProps) {
  const workspace = useOptionalEditorWorkspace();
  const studio = useOptionalStudioWorkspace();
  const centerRef = useRef<HTMLDivElement>(null);

  const focusMode = workspace?.focusMode ?? false;
  const leftCollapsed = focusMode || (workspace?.leftCollapsed ?? false);
  const rightCollapsed = focusMode || (workspace?.rightCollapsed ?? false);
  const isFullscreen = workspace?.isFullscreen ?? false;

  useEffect(() => {
    if (!isFullscreen || !centerRef.current) {
      return;
    }
    const node = centerRef.current;
    void node.requestFullscreen?.().catch(() => {
      workspace?.setFullscreen(false);
    });
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        workspace?.setFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (document.fullscreenElement === node) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, [isFullscreen, workspace]);

  useEffect(() => {
    if (!focusMode) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        workspace?.setFocusMode(false);
        studio?.setAppChromeHidden(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode, workspace, studio]);

  const widthClass = workspace
    ? editorWidthClass(workspace.editorWidth)
    : "max-w-3xl";
  const centered = workspace?.centeredManuscript ?? true;

  return (
    <div
      className={cn(
        "flex min-h-[calc(100vh-4rem)] flex-col",
        isFullscreen && "min-h-screen bg-background",
        className,
      )}
    >
      {header && !focusMode ? (
        <div className="shrink-0 border-b border-border/60 bg-card/80 px-4 py-5 backdrop-blur-sm sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1680px] flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">{header}</div>
            {headerActions ? (
              <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {focusMode ? (
        <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2">
          <p className="text-sm text-muted-foreground">Focus mode · Esc to exit</p>
          {headerActions}
        </div>
      ) : null}

      <div
        className={cn(
          "relative mx-auto grid w-full max-w-[1680px] flex-1 grid-cols-1",
          leftCollapsed && rightCollapsed
            ? "lg:grid-cols-1"
            : leftCollapsed
              ? "lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]"
              : rightCollapsed
                ? "lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)] xl:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(280px,340px)] xl:grid-cols-[minmax(220px,260px)_minmax(0,1fr)_minmax(300px,360px)]",
        )}
      >
        {!leftCollapsed ? (
          <nav
            className="relative border-b border-border/50 bg-muted/15 lg:border-b-0 lg:border-r"
            aria-label="Document navigation"
          >
            {workspace ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute right-2 top-2 z-10 hidden lg:inline-flex"
                aria-label="Collapse navigation panel"
                onClick={workspace.toggleLeft}
              >
                <PanelLeftClose className="size-4" aria-hidden />
              </Button>
            ) : null}
            <div className="p-5 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:pr-6">
              {left}
            </div>
          </nav>
        ) : workspace ? (
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:border-r lg:border-border/50 lg:bg-muted/10 lg:py-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Expand navigation panel"
              onClick={workspace.toggleLeft}
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}

        <div
          ref={centerRef}
          className={cn(
            "min-h-0 min-w-0 bg-background px-4 py-6 sm:px-8 sm:py-8",
            isFullscreen && "overflow-y-auto px-6 py-8 sm:px-12",
          )}
        >
          <div className={cn(centered && "mx-auto w-full", widthClass)}>{center}</div>
        </div>

        {!rightCollapsed ? (
          <div className="relative border-t border-border/50 bg-muted/10 lg:border-t-0 lg:border-l">
            {workspace ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute left-2 top-2 z-10 hidden lg:inline-flex"
                aria-label="Collapse tools panel"
                onClick={workspace.toggleRight}
              >
                <PanelRightClose className="size-4" aria-hidden />
              </Button>
            ) : null}
            {right}
          </div>
        ) : workspace ? (
          <div className="hidden lg:flex lg:flex-col lg:items-center lg:border-l lg:border-border/50 lg:bg-muted/10 lg:py-4">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Expand tools panel"
              onClick={workspace.toggleRight}
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
