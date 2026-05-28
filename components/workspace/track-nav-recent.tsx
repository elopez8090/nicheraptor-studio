"use client";

import { useEffect } from "react";

import { trackNavRecent } from "@/lib/workspace/navigation-recents";
import { recordWorkspaceActivity } from "@/lib/workspace/workspace-activity";
import { rememberLastEditorPath } from "@/lib/workspace/workspace-memory";

type TrackNavRecentProps = {
  id: string;
  title: string;
  href: string;
  kind: "ebook" | "article" | "landing_page";
};

export function TrackNavRecent({ id, title, href, kind }: TrackNavRecentProps) {
  useEffect(() => {
    trackNavRecent({ id, title, href, kind });
    rememberLastEditorPath(href);
    recordWorkspaceActivity({
      id,
      kind:
        kind === "ebook"
          ? "edit_project"
          : kind === "article"
            ? "open_article"
            : "open_page",
      title,
      href,
    });
  }, [href, id, kind, title]);

  return null;
}
