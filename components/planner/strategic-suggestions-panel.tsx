"use client";

import { useState } from "react";
import { LineChart, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StrategicSuggestion } from "@/lib/ai/generators/content-planner";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<StrategicSuggestion["category"], string> = {
  ebook_idea: "Ebook",
  content_gap: "Gap",
  supporting_article: "Article",
  article_series: "Series",
  newsletter: "Newsletter",
  seo_authority: "SEO",
  cannibalization_risk: "Cannibalization",
  expansion: "Expansion",
};

type StrategicSuggestionsPanelProps = {
  className?: string;
};

export function StrategicSuggestionsPanel({
  className,
}: StrategicSuggestionsPanelProps) {
  const [focusNiche, setFocusNiche] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StrategicSuggestion[]>([]);
  const [overlapNotes, setOverlapNotes] = useState<string[]>([]);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/planner/strategic-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusNiche, focusTopic }),
      });
      const data = (await res.json()) as {
        error?: string;
        suggestions?: StrategicSuggestion[];
        overlapNotes?: string[];
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed.");
      }
      setSuggestions(data.suggestions ?? []);
      setOverlapNotes(data.overlapNotes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed.");
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
          <LineChart className="size-5" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Strategic AI analysis
          </h2>
          <p className="text-sm text-muted-foreground">
            Gaps, series, SEO authority, newsletter angles, and cannibalization
            risks based on your full library.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="strategy-niche">
            Niche
          </label>
          <Input
            id="strategy-niche"
            value={focusNiche}
            onChange={(e) => setFocusNiche(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="strategy-topic">
            Optional focus topic
          </label>
          <Input
            id="strategy-topic"
            value={focusTopic}
            onChange={(e) => setFocusTopic(e.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        className="mt-4"
        disabled={loading || !focusNiche.trim()}
        onClick={run}
      >
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : null}
        Analyze strategy
      </Button>

      {overlapNotes.length > 0 ? (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Overlap notes
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {overlapNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {suggestions.length > 0 ? (
        <ul className="mt-6 space-y-3">
          {suggestions.map((s, i) => (
            <li
              key={`${s.title}-${i}`}
              className="rounded-xl border border-border/60 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {CATEGORY_LABELS[s.category]}
                </Badge>
                <Badge
                  variant={
                    s.priority === "high"
                      ? "default"
                      : s.priority === "medium"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {s.priority}
                </Badge>
              </div>
              <p className="mt-2 font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.summary}</p>
              {s.relatedTitles?.length ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Related: {s.relatedTitles.join(", ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
