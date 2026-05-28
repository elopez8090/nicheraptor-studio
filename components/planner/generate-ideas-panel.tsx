"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { GeneratedTopicIdea } from "@/lib/ai/generators/content-planner";
import {
  TOPIC_GENERATION_MODES,
  TOPIC_GENERATION_MODE_LABELS,
  type TopicGenerationMode,
} from "@/lib/planner/constants";
import type { ContentTopicRecord } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

type GenerateIdeasPanelProps = {
  onTopicsSaved?: (topics: ContentTopicRecord[]) => void;
  className?: string;
};

export function GenerateIdeasPanel({
  onTopicsSaved,
  className,
}: GenerateIdeasPanelProps) {
  const [niche, setNiche] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<TopicGenerationMode>("article_ideas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<GeneratedTopicIdea[]>([]);

  async function run(saveToPlanner: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planner/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          audience,
          goal,
          mode,
          saveToPlanner,
          count: 8,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        ideas?: GeneratedTopicIdea[];
        savedTopics?: ContentTopicRecord[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Generation failed.");
      }
      setIdeas(data.ideas ?? []);
      if (data.savedTopics?.length && onTopicsSaved) {
        onTopicsSaved(data.savedTopics);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            AI topic ideas
          </h2>
          <p className="text-sm text-muted-foreground">
            Generates ideas aware of your existing ebooks, articles, and saved
            topics — avoids duplicates and highlights expansion angles.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="planner-niche">
            Niche / focus
          </label>
          <Input
            id="planner-niche"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. backyard chicken keeping"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="planner-audience">
            Audience
          </label>
          <Input
            id="planner-audience"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="planner-goal">
            Goal
          </label>
          <Input
            id="planner-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium" htmlFor="planner-mode">
            Idea type
          </label>
          <select
            id="planner-mode"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as TopicGenerationMode)}
          >
            {TOPIC_GENERATION_MODES.map((m) => (
              <option key={m} value={m}>
                {TOPIC_GENERATION_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={loading || !niche.trim()}
          onClick={() => run(false)}
          variant="outline"
        >
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Preview ideas
        </Button>
        <Button
          type="button"
          disabled={loading || !niche.trim()}
          onClick={() => run(true)}
        >
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
          Generate & save to board
        </Button>
      </div>

      {ideas.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {ideas.map((idea, i) => (
            <li
              key={`${idea.title}-${i}`}
              className="rounded-xl border border-border/60 bg-muted/30 p-4"
            >
              <p className="font-medium">{idea.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {idea.description}
              </p>
              {idea.targetKeyword ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Keyword: {idea.targetKeyword}
                </p>
              ) : null}
              {idea.rationale ? (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  {idea.rationale}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
