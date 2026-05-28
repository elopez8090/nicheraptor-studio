"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
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
  ARTICLE_TYPE_OPTIONS,
  WORD_COUNT_TARGET_PRESETS,
} from "@/lib/articles/article-constants";

export default function NewArticlePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Professional, clear");
  const [articleType, setArticleType] = useState("blog_post");
  const [wordPreset, setWordPreset] = useState<string>("1200");
  const [customWordCount, setCustomWordCount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    let wordCountTarget: number | undefined;
    if (wordPreset === "custom") {
      const n = Number.parseInt(customWordCount, 10);
      if (!Number.isFinite(n) || n < 200) {
        setError("Enter a custom word count of at least 200.");
        setIsSubmitting(false);
        return;
      }
      wordCountTarget = n;
    } else {
      wordCountTarget = Number.parseInt(wordPreset, 10);
    }

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          targetKeyword,
          secondaryKeywords,
          audience,
          tone,
          articleType,
          wordCountTarget,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(
          typeof data?.error === "string" ? data.error : "Could not create article.",
        );
        return;
      }
      if (typeof data.articleId === "string") {
        router.push(`/articles/${data.articleId}/editor`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Articles"
        title="New article"
        description="Set your SEO brief. You can generate an outline and full draft in the editor."
      />

      <Card className="mt-8 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden />
            Article brief
          </CardTitle>
          <CardDescription>Fields map to your articles table and AI prompts.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="topic" className="text-sm font-medium text-foreground">
                Topic
              </label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="e.g. Best practices for email list growth"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="target-keyword"
                className="text-sm font-medium text-foreground"
              >
                Target keyword
              </label>
              <Input
                id="target-keyword"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
                required
                placeholder="primary SEO keyword"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="secondary-keywords"
                className="text-sm font-medium text-foreground"
              >
                Secondary keywords
              </label>
              <Textarea
                id="secondary-keywords"
                value={secondaryKeywords}
                onChange={(e) => setSecondaryKeywords(e.target.value)}
                placeholder="Comma-separated"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="audience" className="text-sm font-medium text-foreground">
                Audience
              </label>
              <Input
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="Who is this for?"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tone" className="text-sm font-medium text-foreground">
                Tone
              </label>
              <Input
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="article-type" className="text-sm font-medium text-foreground">
                Article type
              </label>
              <select
                id="article-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={articleType}
                onChange={(e) => setArticleType(e.target.value)}
              >
                {ARTICLE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Word count target</span>
              <div className="flex flex-wrap gap-2">
                {WORD_COUNT_TARGET_PRESETS.map((n) => (
                  <Button
                    key={n}
                    type="button"
                    size="sm"
                    variant={wordPreset === String(n) ? "default" : "outline"}
                    onClick={() => setWordPreset(String(n))}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant={wordPreset === "custom" ? "default" : "outline"}
                  onClick={() => setWordPreset("custom")}
                >
                  Custom
                </Button>
              </div>
              {wordPreset === "custom" ? (
                <Input
                  type="number"
                  min={200}
                  value={customWordCount}
                  onChange={(e) => setCustomWordCount(e.target.value)}
                  placeholder="e.g. 3000"
                />
              ) : null}
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating…" : "Create article & open editor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
