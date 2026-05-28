"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ARTICLE_STATUS_OPTIONS } from "@/lib/articles/article-constants";
import { countWordsFromHtml } from "@/lib/articles/word-count";

type ArticleSeoSidebarProps = {
  articleId: string;
  targetKeyword: string;
  metaTitle: string | null;
  metaDescription: string | null;
  slug: string | null;
  status: string;
  contentHtml: string;
  onSeoUpdated: (patch: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    slug?: string | null;
    status?: string;
  }) => void;
  onGenerateMeta: (tool: "meta_title" | "meta_description" | "slug") => Promise<void>;
  generatingMeta: string | null;
};

export function ArticleSeoSidebar({
  articleId,
  targetKeyword,
  metaTitle,
  metaDescription,
  slug,
  status,
  contentHtml,
  onSeoUpdated,
  onGenerateMeta,
  generatingMeta,
}: ArticleSeoSidebarProps) {
  const [saving, setSaving] = useState(false);
  const [localMetaTitle, setLocalMetaTitle] = useState(metaTitle ?? "");
  const [localMetaDescription, setLocalMetaDescription] = useState(
    metaDescription ?? "",
  );
  const [localSlug, setLocalSlug] = useState(slug ?? "");
  const [localStatus, setLocalStatus] = useState(status);

  const wordCount = countWordsFromHtml(contentHtml);

  const persist = useCallback(
    async (patch: {
      metaTitle?: string;
      metaDescription?: string;
      slug?: string;
      status?: string;
    }) => {
      setSaving(true);
      try {
        const response = await fetch(`/api/articles/${articleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await response.json();
        if (!response.ok) {
          return;
        }
        onSeoUpdated({
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
          slug: data.slug ?? null,
          status: data.status ?? localStatus,
        });
      } finally {
        setSaving(false);
      }
    },
    [articleId, localStatus, onSeoUpdated],
  );

  return (
    <Card className="shadow-premium">
      <CardHeader>
        <CardTitle className="text-lg">SEO</CardTitle>
        <CardDescription>Metadata and publishing status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Target keyword</p>
          <p className="text-sm text-muted-foreground">{targetKeyword || "—"}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Word count</span>
          <span className="font-medium tabular-nums">{wordCount}</span>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="article-status" className="text-sm font-medium text-foreground">
            Status
          </label>
          <select
            id="article-status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={localStatus}
            onChange={(e) => {
              setLocalStatus(e.target.value);
              void persist({ status: e.target.value });
            }}
          >
            {ARTICLE_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="meta-title" className="text-sm font-medium text-foreground">
              Meta title
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={generatingMeta === "meta_title"}
              onClick={() => void onGenerateMeta("meta_title")}
            >
              {generatingMeta === "meta_title" ? "…" : "Generate"}
            </Button>
          </div>
          <Input
            id="meta-title"
            value={localMetaTitle}
            onChange={(e) => setLocalMetaTitle(e.target.value)}
            onBlur={() => void persist({ metaTitle: localMetaTitle })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="meta-description"
              className="text-sm font-medium text-foreground"
            >
              Meta description
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={generatingMeta === "meta_description"}
              onClick={() => void onGenerateMeta("meta_description")}
            >
              {generatingMeta === "meta_description" ? "…" : "Generate"}
            </Button>
          </div>
          <Textarea
            id="meta-description"
            rows={3}
            value={localMetaDescription}
            onChange={(e) => setLocalMetaDescription(e.target.value)}
            onBlur={() => void persist({ metaDescription: localMetaDescription })}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="slug" className="text-sm font-medium text-foreground">
              Slug
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={generatingMeta === "slug"}
              onClick={() => void onGenerateMeta("slug")}
            >
              {generatingMeta === "slug" ? "…" : "Generate"}
            </Button>
          </div>
          <Input
            id="slug"
            value={localSlug}
            onChange={(e) => setLocalSlug(e.target.value)}
            onBlur={() => void persist({ slug: localSlug })}
          />
        </div>

        {saving ? (
          <p className="text-xs text-muted-foreground">Saving SEO fields…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
