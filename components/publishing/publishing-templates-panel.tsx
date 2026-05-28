"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PublishingTemplate } from "@/lib/publishing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  templates: PublishingTemplate[];
};

export function PublishingTemplatesPanel({ templates }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("newsletter");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/publishing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          templateKind: kind,
          body,
        }),
      });
      setName("");
      setBody("");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Publishing templates</CardTitle>
        <CardDescription>
          Reusable newsletter, article, CTA, and social formatting templates for repurposing workflows.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={saveTemplate} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="tpl-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekly newsletter shell"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="tpl-kind" className="text-sm font-medium">
                Kind
              </label>
              <select
                id="tpl-kind"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="newsletter">Newsletter</option>
                <option value="article">Article</option>
                <option value="cta">CTA</option>
                <option value="social">Social</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="tpl-body" className="text-sm font-medium">
              Template body
            </label>
            <Textarea
              id="tpl-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[120px] font-mono text-xs"
              placeholder="## Intro&#10;{{hook}}&#10;&#10;## Main&#10;{{body}}"
            />
          </div>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save template"}
          </Button>
        </form>

        {templates.length > 0 ? (
          <ul className="text-sm divide-y divide-border rounded-xl border border-border/60">
            {templates.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <span className="font-medium">{t.name}</span>
                <span className="text-muted-foreground"> · {t.templateKind}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
