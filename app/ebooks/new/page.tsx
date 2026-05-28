"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lightbulb, RefreshCw, Sparkles } from "lucide-react";

import { OutlineGenerationLoader } from "@/components/ebooks/outline-generation-loader";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { useToast } from "@/components/providers/toast-provider";
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
import {
  clampOutlineChapterCount,
  getChapterCountHelperDescription,
  getEbookSizeEstimateLabel,
  OUTLINE_CHAPTER_COUNT_DEFAULT,
  OUTLINE_CHAPTER_COUNT_MAX,
  OUTLINE_CHAPTER_COUNT_MIN,
  OUTLINE_CHAPTER_COUNT_PRESETS,
} from "@/lib/ebooks/outline-chapter-count";
import type { UserWorkspaceSettings } from "@/lib/ebooks/workspace-settings-types";
import { DEFAULT_WORKSPACE_SETTINGS } from "@/lib/ebooks/workspace-settings-types";
import { safeFetchJson } from "@/lib/utils/safe-fetch";

type OutlineState = {
  title: string;
  audience: string;
  goal: string;
  chapters: { title: string; summary: string }[];
};

export default function NewEbookPage() {
  const router = useRouter();
  const toast = useToast();
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [writingTone, setWritingTone] = useState(
    DEFAULT_WORKSPACE_SETTINGS.defaultWritingTone,
  );
  const [ebookStyle, setEbookStyle] = useState(
    DEFAULT_WORKSPACE_SETTINGS.defaultEbookStyle,
  );
  const [outline, setOutline] = useState<OutlineState | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [titleIdeas, setTitleIdeas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingTitles, setIsLoadingTitles] = useState(false);
  const [chapterCount, setChapterCount] = useState(OUTLINE_CHAPTER_COUNT_DEFAULT);
  const [chapterCountAuto, setChapterCountAuto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDefaults() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as UserWorkspaceSettings;
        if (cancelled) return;
        setWritingTone(data.defaultWritingTone);
        setEbookStyle(data.defaultEbookStyle);
        if (data.defaultAudience && !audience) {
          setAudience(data.defaultAudience);
        }
      } catch {
        /* keep defaults */
      }
    }
    void loadDefaults();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once; audience seeded from settings only when empty
  }, []);

  async function handleGenerateOutline() {
    const trimmedTopic = topic.trim();
    const trimmedAudience = audience.trim();
    const trimmedGoal = goal.trim();
    if (!trimmedTopic || !trimmedAudience || !trimmedGoal) {
      setError("Topic, audience, and goal are required.");
      toast.warning("Missing required fields", "Fill in topic, audience, and goal first.");
      return;
    }
    setError(null);
    setOutline(null);
    setProjectId(null);
    setIsGenerating(true);

    try {
      const response = await safeFetchJson<OutlineState & { error?: string }>(
        "/api/generate-outline",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic: trimmedTopic,
            audience: trimmedAudience,
            goal: trimmedGoal,
            writingTone,
            ebookStyle,
            chapterCount: chapterCountAuto ? undefined : chapterCount,
            chapterCountAuto,
          }),
          fallbackError: "Failed to generate outline. Please try again.",
        },
      );

      if (!response.ok) {
        setError(response.error);
        toast.toast({
          title: "Outline generation failed",
          description: response.error,
          variant: "error",
        });
        return;
      }

      const data = response.data;
      if (!Array.isArray(data.chapters) || data.chapters.length === 0) {
        setError("The outline is missing chapters. Please generate again.");
        toast.warning("Outline incomplete", "No chapters were returned. Try again.");
        return;
      }

      const saveResponse = await safeFetchJson<{ projectId?: string; error?: string }>(
        "/api/ebook-projects",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          fallbackError: "Failed to save outline. Please try again.",
        },
      );
      if (!saveResponse.ok) {
        setError(saveResponse.error);
        toast.toast({
          title: "Outline save failed",
          description: saveResponse.error,
          variant: "error",
        });
        return;
      }

      if (
        typeof saveResponse.data?.projectId !== "string" ||
        !saveResponse.data.projectId.trim()
      ) {
        setError("Project was not saved correctly. Please try again.");
        return;
      }

      setOutline(data);
      setProjectId(saveResponse.data.projectId.trim());
      toast.success("Outline ready", "Review and approve to continue.");
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Unexpected error", "Something went wrong while generating the outline.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRegenerateTitleIdeas() {
    if (!topic.trim()) {
      setError("Enter a topic first to get title ideas.");
      return;
    }
    setIsLoadingTitles(true);
    setError(null);
    try {
      const response = await safeFetchJson<{ titles?: string[]; error?: string }>(
        "/api/generate-title-ideas",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, audience, goal }),
          fallbackError: "Could not generate title ideas.",
        },
      );
      if (!response.ok) {
        setError(response.error);
        toast.warning("Title ideas unavailable", response.error);
        return;
      }
      setTitleIdeas(response.data.titles ?? []);
      if ((response.data.titles ?? []).length === 0) {
        toast.warning("No ideas returned", "Try refining your topic and regenerate.");
      }
    } catch {
      setError("Could not generate title ideas.");
      toast.error("Title generation failed", "Could not generate title ideas.");
    } finally {
      setIsLoadingTitles(false);
    }
  }

  async function handleRegenerateOutlineTitle() {
    if (!outline || !projectId) return;
    await handleRegenerateTitleIdeas();
  }

  function applyTitleIdea(title: string) {
    setTopic(title);
    if (outline && projectId) {
      setOutline({ ...outline, title });
      void safeFetchJson(`/api/ebook-projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
        fallbackError: "Could not update title.",
      });
    }
  }

  function handleApproveOutline() {
    if (!projectId) {
      setError("Project was not saved. Please generate the outline again.");
      return;
    }
    router.refresh();
    router.push(`/ebooks/${projectId.trim()}/editor`);
  }

  function applyChapterCountPreset(count: number) {
    setChapterCountAuto(false);
    setChapterCount(clampOutlineChapterCount(count));
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="New project"
        title="Create ebook"
        description="Describe your topic and audience — we&apos;ll generate a structured outline you can approve before writing chapters."
      />

      <Card className="mt-10 shadow-premium">
        <CardHeader>
          <CardTitle className="text-xl">Outline brief</CardTitle>
          <CardDescription>
            Defaults come from{" "}
            <a href="/settings" className="font-medium text-foreground underline-offset-2 hover:underline">
              Settings
            </a>
            . Be specific about who you&apos;re writing for and what they should achieve.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium text-foreground">
              Ebook topic
            </label>
            <Input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Example: How to start a local newsletter"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoadingTitles || !topic.trim()}
              onClick={() => void handleRegenerateTitleIdeas()}
            >
              <Lightbulb aria-hidden />
              {isLoadingTitles ? "Generating ideas…" : "Suggest title ideas"}
            </Button>
          </div>

          {titleIdeas.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {titleIdeas.map((title) => (
                <li key={title}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyTitleIdea(title)}
                  >
                    {title}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="audience" className="text-sm font-medium text-foreground">
              Target audience
            </label>
            <Input
              id="audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Example: Local business owners"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="goal" className="text-sm font-medium text-foreground">
              Ebook goal
            </label>
            <Textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What should the reader achieve?"
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="chapter-count" className="text-sm font-medium text-foreground">
                Chapter count
              </label>
              {!chapterCountAuto ? (
                <span className="text-sm text-muted-foreground">
                  Estimated size:{" "}
                  <span className="font-medium text-foreground">
                    {getEbookSizeEstimateLabel(chapterCount)}
                  </span>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  AI will pick between {OUTLINE_CHAPTER_COUNT_MIN}–{OUTLINE_CHAPTER_COUNT_MAX}{" "}
                  chapters from your topic
                </span>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="chapter-count-auto"
                type="checkbox"
                checked={chapterCountAuto}
                onChange={(e) => setChapterCountAuto(e.target.checked)}
                className="mt-1 size-4 rounded border-border accent-primary"
              />
              <label htmlFor="chapter-count-auto" className="text-sm leading-snug text-foreground">
                Auto decide best chapter count
                <span className="mt-0.5 block text-muted-foreground">
                  Uses topic complexity to choose depth between {OUTLINE_CHAPTER_COUNT_MIN} and{" "}
                  {OUTLINE_CHAPTER_COUNT_MAX} chapters.
                </span>
              </label>
            </div>

            <div className={chapterCountAuto ? "pointer-events-none opacity-50" : undefined}>
              <div className="flex flex-wrap gap-2">
                {OUTLINE_CHAPTER_COUNT_PRESETS.map((preset) => {
                  const isActive = !chapterCountAuto && chapterCount === preset.count;
                  return (
                    <Button
                      key={preset.count}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      disabled={chapterCountAuto}
                      onClick={() => applyChapterCountPreset(preset.count)}
                      aria-pressed={isActive}
                    >
                      {preset.label}
                      <span
                        className={
                          isActive
                            ? "ml-1 tabular-nums opacity-90"
                            : "ml-1 tabular-nums text-muted-foreground"
                        }
                      >
                        ({preset.count})
                      </span>
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  id="chapter-count"
                  type="range"
                  min={OUTLINE_CHAPTER_COUNT_MIN}
                  max={OUTLINE_CHAPTER_COUNT_MAX}
                  value={chapterCount}
                  disabled={chapterCountAuto}
                  onChange={(e) => setChapterCount(Number(e.target.value))}
                  className="h-2 min-w-[12rem] flex-1 cursor-pointer accent-primary"
                />
                <Input
                  type="number"
                  min={OUTLINE_CHAPTER_COUNT_MIN}
                  max={OUTLINE_CHAPTER_COUNT_MAX}
                  value={chapterCount}
                  disabled={chapterCountAuto}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isFinite(next)) {
                      setChapterCount(clampOutlineChapterCount(next));
                    }
                  }}
                  className="w-20 tabular-nums"
                  aria-label="Chapter count"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {getChapterCountHelperDescription(chapterCount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground/80">
                {OUTLINE_CHAPTER_COUNT_MIN}–{OUTLINE_CHAPTER_COUNT_MAX} chapters · adjust with the
                slider or number field
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={() => void handleGenerateOutline()}
            disabled={isGenerating}
          >
            <Sparkles aria-hidden />
            {isGenerating ? "Generating & saving…" : "Generate outline"}
          </Button>

          {error && (
            <p
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {outline && (
        <Card className="mt-8 shadow-premium">
          <CardHeader className="border-b border-border/60">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle className="text-2xl tracking-tight">{outline.title}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoadingTitles}
                onClick={() => void handleRegenerateOutlineTitle()}
              >
                <RefreshCw aria-hidden />
                New title ideas
              </Button>
            </div>
            <CardDescription className="space-y-1 text-base">
              <p>
                <span className="font-medium text-foreground">Audience:</span>{" "}
                {outline.audience}
              </p>
              <p>
                <span className="font-medium text-foreground">Chapters:</span>{" "}
                {outline.chapters.length}{" "}
                <span className="text-muted-foreground">
                  ({getEbookSizeEstimateLabel(outline.chapters.length)})
                </span>
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {titleIdeas.length > 0 ? (
              <div className="mb-6 flex flex-wrap gap-2">
                {titleIdeas.map((title) => (
                  <Button
                    key={title}
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => applyTitleIdea(title)}
                  >
                    Use: {title}
                  </Button>
                ))}
              </div>
            ) : null}

            <ol className="space-y-4">
              {outline.chapters.map((chapter, index) => (
                <li
                  key={index}
                  className="rounded-xl border border-border/60 bg-muted/40 p-5 shadow-sm"
                >
                  <h3 className="text-base font-semibold text-foreground">
                    Chapter {index + 1}: {chapter.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                    {chapter.summary}
                  </p>
                </li>
              ))}
            </ol>

            {projectId ? (
              <OutlineGenerationLoader
                projectId={projectId}
                ebookTitle={outline.title}
                audience={outline.audience}
                goal={outline.goal}
              />
            ) : null}
            <Button
              type="button"
              size="lg"
              className="mt-8"
              onClick={handleApproveOutline}
              disabled={!projectId}
            >
              Approve outline & continue
            </Button>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
