"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "@/lib/studio-icons";

import { REPURPOSING_UI_ACTIONS } from "@/lib/publishing/constants";
import type { PublishingTemplate, RepurposingJob } from "@/lib/publishing/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  recentJobs: RepurposingJob[];
  templates: PublishingTemplate[];
};

const REPURPOSE_FLOWS = [
  { workflow: "ebook_chapter_to_article", label: "Ebook chapter → article" },
  { workflow: "article_to_newsletter", label: "Article → newsletter" },
  { workflow: "article_to_social", label: "Article → social posts" },
  { workflow: "ebook_to_lead_magnet", label: "Ebook → lead magnet" },
  { workflow: "article_to_faq", label: "Article → FAQ page" },
  { workflow: "article_to_thread_series", label: "Article → thread series" },
] as const;

export function RepurposingWorkbench({ recentJobs, templates }: Props) {
  const router = useRouter();
  const [sourceType, setSourceType] = useState("article");
  const [articleId, setArticleId] = useState("");
  const [ebookProjectId, setEbookProjectId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [templateId, setTemplateId] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);

  async function runWorkflow(workflow: string) {
    setRunning(workflow);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/publishing/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow,
          sourceType,
          articleId: sourceType === "article" ? articleId : undefined,
          ebookProjectId:
            sourceType === "ebook" || sourceType === "ebook_chapter"
              ? ebookProjectId
              : undefined,
          chapterId: sourceType === "ebook_chapter" ? chapterId : undefined,
          templateId: templateId || undefined,
          addToQueue: true,
          createArticle:
            workflow === "convert_to_article" ||
            workflow === "ebook_chapter_to_article",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        content?: string;
        articleId?: string;
        queueItemId?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Repurposing failed.");
        return;
      }
      setResult(data.content ?? "");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setRunning(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Content repurposing</CardTitle>
          <CardDescription>
            Turn ebooks and articles into articles, newsletters, social posts, lead magnets, FAQs,
            and threads. Uses your existing AI engine and adds results to the publishing queue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="rep-source" className="text-sm font-medium">
              Source
            </label>
            <select
              id="rep-source"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
            >
              <option value="article">Article ID</option>
              <option value="ebook_chapter">Ebook chapter</option>
              <option value="ebook">Full ebook</option>
            </select>
          </div>

          {sourceType === "article" ? (
            <div className="space-y-1">
              <label htmlFor="article-id" className="text-sm font-medium">
                Article ID
              </label>
              <Input
                id="article-id"
                value={articleId}
                onChange={(e) => setArticleId(e.target.value)}
                placeholder="UUID from Articles"
              />
            </div>
          ) : null}

          {sourceType === "ebook_chapter" || sourceType === "ebook" ? (
            <>
              <div className="space-y-1">
                <label htmlFor="ebook-id" className="text-sm font-medium">
                  Ebook project ID
                </label>
                <Input
                  id="ebook-id"
                  value={ebookProjectId}
                  onChange={(e) => setEbookProjectId(e.target.value)}
                />
              </div>
              {sourceType === "ebook_chapter" ? (
                <div className="space-y-1">
                  <label htmlFor="chapter-id" className="text-sm font-medium">
                    Chapter ID
                  </label>
                  <Input
                    id="chapter-id"
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                  />
                </div>
              ) : null}
            </>
          ) : null}

          {templates.length > 0 ? (
            <div className="space-y-1">
              <label htmlFor="rep-template" className="text-sm font-medium">
                Template (optional)
              </label>
              <select
                id="rep-template"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={templateId || "none"}
                onChange={(e) =>
                  setTemplateId(e.target.value === "none" ? "" : e.target.value)
                }
              >
                <option value="none">None</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.templateKind})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Find IDs on{" "}
            <Link href="/articles" className="underline">
              Articles
            </Link>{" "}
            or{" "}
            <Link href="/projects" className="underline">
              Projects
            </Link>{" "}
            (editor URLs include UUIDs).
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">Pipeline workflows</p>
            <div className="flex flex-wrap gap-2">
              {REPURPOSE_FLOWS.map(({ workflow, label }) => (
                <Button
                  key={workflow}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!!running}
                  onClick={() => runWorkflow(workflow)}
                >
                  {running === workflow ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-sm font-medium">AI quick actions</p>
            <div className="flex flex-wrap gap-2">
              {REPURPOSING_UI_ACTIONS.map(({ id, label }) => (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!running}
                  onClick={() => runWorkflow(id)}
                >
                  {running === id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : null}
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Output preview</CardTitle>
          <CardDescription>Latest repurposing result (also queued as draft).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            readOnly
            className="min-h-[280px] font-mono text-xs"
            value={result ?? ""}
            placeholder="Run a workflow to see generated content here."
          />
          {recentJobs.length > 0 ? (
            <div>
              <p className="text-sm font-medium mb-2">Recent jobs</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {recentJobs.slice(0, 5).map((job) => (
                  <li key={job.id}>
                    {job.workflow} — {job.status}
                    {job.completedAt ? ` · ${new Date(job.completedAt).toLocaleString()}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
