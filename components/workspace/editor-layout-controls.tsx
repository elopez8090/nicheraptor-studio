"use client";

import { cn } from "@/lib/utils";
import {
  AlignCenter,
  Expand,
  Focus,
  Maximize2,
  Minimize2,
  PanelLeft,
  PanelRight,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useEditorWorkspace,
  type EditorWidthPreset,
} from "@/components/workspace/editor-workspace-context";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";

type EditorLayoutControlsProps = {
  className?: string;
};

export function EditorLayoutControls({ className }: EditorLayoutControlsProps) {
  const workspace = useEditorWorkspace();
  const studio = useStudioWorkspace();

  const widthLabel: Record<EditorWidthPreset, string> = {
    narrow: "Narrow",
    default: "Default",
    wide: "Wide",
    full: "Full width",
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={workspace.leftCollapsed ? "Show chapter panel" : "Hide chapter panel"}
        aria-pressed={workspace.leftCollapsed}
        onClick={workspace.toggleLeft}
      >
        <PanelLeft className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={workspace.rightCollapsed ? "Show tools panel" : "Hide tools panel"}
        aria-pressed={workspace.rightCollapsed}
        onClick={workspace.toggleRight}
      >
        <PanelRight className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant={workspace.focusMode ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Distraction-free writing mode"
        aria-pressed={workspace.focusMode}
        onClick={() => workspace.setFocusMode(!workspace.focusMode)}
      >
        <Focus className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant={workspace.centeredManuscript ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label="Toggle centered manuscript layout"
        aria-pressed={workspace.centeredManuscript}
        onClick={() =>
          workspace.setCenteredManuscript(!workspace.centeredManuscript)
        }
      >
        <AlignCenter className="size-4" aria-hidden />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Editor width">
            <Type className="size-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {(Object.keys(widthLabel) as EditorWidthPreset[]).map((preset) => (
            <DropdownMenuItem
              key={preset}
              onClick={() => workspace.setEditorWidth(preset)}
              className={cn(
                workspace.editorWidth === preset && "font-medium text-primary",
              )}
            >
              {widthLabel[preset]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        type="button"
        variant={workspace.isFullscreen ? "secondary" : "ghost"}
        size="icon-sm"
        aria-label={workspace.isFullscreen ? "Exit fullscreen editor" : "Fullscreen editor"}
        onClick={() => workspace.setFullscreen(!workspace.isFullscreen)}
      >
        {workspace.isFullscreen ? (
          <Minimize2 className="size-4" aria-hidden />
        ) : (
          <Maximize2 className="size-4" aria-hidden />
        )}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Hide app navigation for focus"
        className="hidden sm:inline-flex"
        onClick={() => {
          workspace.setFocusMode(true);
          studio.setAppChromeHidden(true);
        }}
      >
        <Expand className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
