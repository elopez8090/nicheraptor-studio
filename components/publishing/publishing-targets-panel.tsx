"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PublishingTarget } from "@/lib/publishing/types";
import { DEFAULT_PLATFORM_LABELS } from "@/lib/publishing/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  targets: PublishingTarget[];
};

export function PublishingTargetsPanel({ targets }: Props) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleEnabled(target: PublishingTarget, isEnabled: boolean) {
    setBusyId(target.id);
    try {
      await fetch("/api/publishing/targets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: target.id, isEnabled }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Publishing targets</CardTitle>
        <CardDescription>
          Architecture-ready connectors for WordPress, newsletters, and export paths.
          API keys and auto-posting can be wired in later without changing your queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {targets.map((target) => {
          const label =
            DEFAULT_PLATFORM_LABELS[target.platformType] ?? target.name;
          const exportOnly =
            target.platformType === "markdown_export" ||
            target.platformType === "html_export";
          return (
            <div
              key={target.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-foreground">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {exportOnly ? (
                    <Badge variant="secondary">Export</Badge>
                  ) : (
                    <Badge variant="outline">API-ready</Badge>
                  )}
                  {target.webhookUrl ? (
                    <Badge variant="outline">Webhook</Badge>
                  ) : null}
                  {target.rssFeedUrl ? (
                    <Badge variant="outline">RSS</Badge>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {target.isEnabled ? "Enabled" : "Off"}
                </span>
                <input
                  type="checkbox"
                  className="size-4 rounded border-input"
                  checked={target.isEnabled}
                  disabled={busyId === target.id}
                  onChange={(e) => toggleEnabled(target, e.target.checked)}
                  aria-label={`Toggle ${label}`}
                />
              </div>
            </div>
          );
        })}
        <p className="text-xs text-muted-foreground pt-2">
          Future: scheduled publishing, SEO workflows, and platform OAuth — stored per target in{" "}
          <code className="text-[11px]">config</code>.
        </p>
        <Button variant="outline" size="sm" className="mt-2" asChild>
          <a href="/publishing/queue">Open publishing queue</a>
        </Button>
      </CardContent>
    </Card>
  );
}
