"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FileText,
  Layers,
  PanelsTopLeft,
  Sparkles,
} from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ProjectKind = "ebook" | "article" | "landing_page";
type StartMode = "template" | "blank";

const KIND_META: Record<
  ProjectKind,
  { label: string; icon: typeof BookOpen; href: string; helper: string }
> = {
  ebook: {
    label: "Ebook",
    icon: BookOpen,
    href: "/ebooks/new",
    helper: "Long-form chapter workflow with exports",
  },
  article: {
    label: "Article",
    icon: FileText,
    href: "/articles/new",
    helper: "SEO brief, outline, and draft generation",
  },
  landing_page: {
    label: "Landing Page",
    icon: PanelsTopLeft,
    href: "/pages/new",
    helper: "Conversion page builder with reusable sections",
  },
};

export default function CreatePage() {
  const [kind, setKind] = useState<ProjectKind>("ebook");
  const [startMode, setStartMode] = useState<StartMode>("template");
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");

  const selected = KIND_META[kind];
  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("starter", startMode);
    if (name.trim()) params.set("title", name.trim());
    if (audience.trim()) params.set("audience", audience.trim());
    if (goal.trim()) params.set("goal", goal.trim());
    return params.toString();
  }, [audience, goal, name, startMode]);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Quick create"
        title="Create something new"
        description="Choose your content type, pick a starting mode, and launch the guided setup."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-lg">1) Choose content type</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(KIND_META) as ProjectKind[]).map((value) => {
              const meta = KIND_META[value];
              const Icon = meta.icon;
              const active = kind === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setKind(value)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                      : "border-border/70 hover:bg-muted/50"
                  }`}
                >
                  <Icon className="size-5 text-primary" aria-hidden />
                  <p className="mt-2 font-medium">{meta.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{meta.helper}</p>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-lg">2) Start mode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(
              [
                {
                  id: "template",
                  title: "Use template",
                  description: "Start from a proven structure and adjust it quickly.",
                  icon: Layers,
                },
                {
                  id: "blank",
                  title: "Start blank",
                  description: "Begin from scratch with full control.",
                  icon: Sparkles,
                },
              ] as const
            ).map((option) => {
              const Icon = option.icon;
              const active = startMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setStartMode(option.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${
                    active
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                      : "border-border/70 hover:bg-muted/50"
                  }`}
                >
                  <Icon className="mt-0.5 size-4 text-primary" aria-hidden />
                  <span>
                    <span className="block font-medium">{option.title}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-premium">
        <CardHeader>
          <CardTitle className="text-lg">3) Guided setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="create-name" className="text-sm font-medium">
              Working title
            </label>
            <Input
              id="create-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="create-audience" className="text-sm font-medium">
              Audience
            </label>
            <Input
              id="create-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Who this is for"
            />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <label htmlFor="create-goal" className="text-sm font-medium">
              Goal
            </label>
            <Textarea
              id="create-goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What result should this produce?"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button size="lg" asChild>
          <Link href={`${selected.href}${query ? `?${query}` : ""}`}>
            Continue to {selected.label} setup
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
