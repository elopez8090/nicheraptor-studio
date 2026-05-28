"use client";

import { useEffect } from "react";

import { useOptionalStudioWorkspace } from "@/components/workspace/studio-workspace-context";

/** Sets the last breadcrumb segment while a page or editor is mounted. */
export function useBreadcrumbTail(label: string | null | undefined) {
  const studio = useOptionalStudioWorkspace();

  useEffect(() => {
    if (!studio) return;
    const trimmed = label?.trim() || null;
    studio.setBreadcrumbTail(trimmed);
    return () => studio.setBreadcrumbTail(null);
  }, [label, studio]);
}
