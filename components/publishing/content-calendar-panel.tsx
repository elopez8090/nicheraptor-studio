"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ContentCalendarEntry } from "@/lib/publishing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Props = {
  entries: ContentCalendarEntry[];
};

export function ContentCalendarPanel({ entries }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [contentType, setContentType] = useState("article");
  const [targetPlatform, setTargetPlatform] = useState("markdown_export");
  const [priority, setPriority] = useState("0");
  const [saving, setSaving] = useState(false);

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/publishing/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          plannedPublishDate: plannedDate || null,
          publishingPriority: Number(priority) || 0,
          contentType,
          targetPlatform,
        }),
      });
      setTitle("");
      setPlannedDate("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Content calendar</CardTitle>
        <CardDescription>
          Plan publish dates, priority, content type, and target platform before items hit the queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={addEntry} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-1">
            <label htmlFor="cal-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="cal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Newsletter #12 — spring launch"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cal-date" className="text-sm font-medium">
              Planned publish date
            </label>
            <Input
              id="cal-date"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cal-priority" className="text-sm font-medium">
              Priority
            </label>
            <Input
              id="cal-priority"
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="cal-content-type" className="text-sm font-medium">
              Content type
            </label>
            <select
              id="cal-content-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="article">Article</option>
              <option value="newsletter">Newsletter</option>
              <option value="social">Social</option>
              <option value="ebook">Ebook</option>
              <option value="lead_magnet">Lead magnet</option>
              <option value="faq">FAQ</option>
              <option value="thread">Thread</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="cal-platform" className="text-sm font-medium">
              Target platform
            </label>
            <select
              id="cal-platform"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
            >
              <option value="wordpress">WordPress</option>
              <option value="ghost">Ghost</option>
              <option value="beehiiv">Beehiiv</option>
              <option value="substack">Substack</option>
              <option value="medium">Medium</option>
              <option value="markdown_export">Markdown export</option>
              <option value="html_export">HTML export</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? "Saving…" : "Add calendar entry"}
            </Button>
          </div>
        </form>

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No planned items yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border/60">
            {entries.slice(0, 8).map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{entry.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {entry.contentType} → {entry.targetPlatform}
                    {entry.plannedPublishDate
                      ? ` · ${entry.plannedPublishDate}`
                      : ""}
                    {entry.publishingPriority
                      ? ` · priority ${entry.publishingPriority}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
