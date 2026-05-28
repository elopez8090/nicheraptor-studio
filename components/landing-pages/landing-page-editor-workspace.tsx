"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Eye,
  GripVertical,
  Monitor,
  Plus,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";

import { LandingPageTipTapEditor } from "@/components/editor/LandingPageTipTapEditor";
import { PageHeader } from "@/components/layout/page-header";
import { ThreeColumnWorkspace } from "@/components/layout/three-column-workspace";
import { TrackNavRecent } from "@/components/workspace/track-nav-recent";
import { useBreadcrumbTail } from "@/components/workspace/use-breadcrumb-tail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LandingPageRecord } from "@/lib/landing-pages/fetch-landing-page";

type Props = {
  page: LandingPageRecord;
};

type ToolAction =
  | "improve_headline"
  | "increase_urgency"
  | "make_more_persuasive"
  | "add_emotional_triggers"
  | "improve_cta"
  | "rewrite_for_clarity"
  | "simplify_copy";

type SectionType =
  | "hero"
  | "benefits"
  | "problem"
  | "solution"
  | "cta"
  | "testimonials"
  | "faq"
  | "offer_stack"
  | "guarantee"
  | "closing_cta"
  | "features"
  | "pricing"
  | "countdown"
  | "lead_form"
  | "about"
  | "comparison"
  | "bonus"
  | "custom";

type SectionBlock = {
  id: string;
  title: string;
  type: SectionType;
  roleLabel: string;
  html: string;
  collapsed: boolean;
};

type SectionLibraryItem = {
  id: string;
  name: string;
  type: SectionType;
  html: string;
  favorite: boolean;
};

type TemplatePreset = {
  id: string;
  label: string;
  sections: Array<{ type: SectionType; title: string; html: string }>;
};

const EMPTY_PAGE_HTML = "<section id='hero'><h1>Your headline</h1><p>Your subheadline</p></section>";
const SECTION_LIBRARY_KEY = "landing-builder-section-library-v1";

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  benefits: "Benefits",
  problem: "Problem",
  solution: "Solution",
  cta: "CTA",
  testimonials: "Testimonials",
  faq: "FAQ",
  offer_stack: "Offer stack",
  guarantee: "Guarantee",
  closing_cta: "Closing CTA",
  features: "Features",
  pricing: "Pricing",
  countdown: "Countdown",
  lead_form: "Lead form",
  about: "About",
  comparison: "Comparison table",
  bonus: "Bonus section",
  custom: "Custom section",
};

const SECTION_ROLE_LABELS: Record<SectionType, string> = {
  hero: "attention grabber",
  benefits: "emotional trigger",
  problem: "emotional trigger",
  solution: "trust builder",
  cta: "CTA section",
  testimonials: "trust builder",
  faq: "trust builder",
  offer_stack: "trust builder",
  guarantee: "trust builder",
  closing_cta: "CTA section",
  features: "trust builder",
  pricing: "urgency section",
  countdown: "urgency section",
  lead_form: "CTA section",
  about: "trust builder",
  comparison: "trust builder",
  bonus: "emotional trigger",
  custom: "trust builder",
};

const QUICK_ADD_BLOCKS: Array<{ type: SectionType; label: string; html: string }> = [
  { type: "hero", label: "Hero", html: `<section id="hero"><h1>Your strongest promise</h1><p>Clear one-line value proposition.</p><p><strong>CTA:</strong> Start now</p></section>` },
  { type: "cta", label: "CTA", html: `<section id="cta"><h2>Take action now</h2><p>Remind readers what they gain today.</p><p><strong>CTA:</strong> Get started</p></section>` },
  { type: "features", label: "Features", html: `<section id="features"><h2>Core features</h2><ul><li>Feature one</li><li>Feature two</li><li>Feature three</li></ul></section>` },
  { type: "faq", label: "FAQ", html: `<section id="faq"><h2>Frequently asked questions</h2><h3>Question</h3><p>Answer...</p></section>` },
  { type: "pricing", label: "Pricing", html: `<section id="pricing"><h2>Simple pricing</h2><p>Starter - $49/month</p><p>Pro - $99/month</p></section>` },
  { type: "testimonials", label: "Testimonials", html: `<section id="testimonials"><h2>What customers say</h2><blockquote>"This solved our problem fast."</blockquote></section>` },
  { type: "countdown", label: "Countdown placeholder", html: `<section id="countdown"><h2>Limited time window</h2><p>[Countdown timer placeholder]</p></section>` },
  { type: "lead_form", label: "Lead form placeholder", html: `<section id="lead-form"><h2>Get instant access</h2><p>[Lead form placeholder]</p></section>` },
  { type: "about", label: "About section", html: `<section id="about"><h2>Why trust us</h2><p>Short founder or company story.</p></section>` },
  { type: "comparison", label: "Comparison table", html: `<section id="comparison"><h2>How we compare</h2><p>[Comparison table placeholder]</p></section>` },
  { type: "bonus", label: "Bonus section", html: `<section id="bonus"><h2>Bonuses included</h2><ul><li>Bonus one</li><li>Bonus two</li></ul></section>` },
];

const TEMPLATE_PRESETS: TemplatePreset[] = [
  { id: "saas", label: "SaaS", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[2], QUICK_ADD_BLOCKS[4], QUICK_ADD_BLOCKS[5], QUICK_ADD_BLOCKS[3], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "ebook-sales", label: "Ebook Sales", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[2], QUICK_ADD_BLOCKS[10], QUICK_ADD_BLOCKS[5], QUICK_ADD_BLOCKS[3], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "local-service", label: "Local Service", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[8], QUICK_ADD_BLOCKS[2], QUICK_ADD_BLOCKS[5], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "lead-magnet", label: "Lead Magnet", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[6], QUICK_ADD_BLOCKS[7], QUICK_ADD_BLOCKS[3], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "webinar", label: "Webinar", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[6], QUICK_ADD_BLOCKS[2], QUICK_ADD_BLOCKS[5], QUICK_ADD_BLOCKS[7], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "affiliate-review", label: "Affiliate Review", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[9], QUICK_ADD_BLOCKS[5], QUICK_ADD_BLOCKS[3], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "product-launch", label: "Product Launch", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[6], QUICK_ADD_BLOCKS[2], QUICK_ADD_BLOCKS[10], QUICK_ADD_BLOCKS[5], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
  { id: "newsletter-optin", label: "Newsletter Opt-in", sections: [QUICK_ADD_BLOCKS[0], QUICK_ADD_BLOCKS[8], QUICK_ADD_BLOCKS[7], QUICK_ADD_BLOCKS[3], QUICK_ADD_BLOCKS[1]].map((s) => ({ type: s.type, title: SECTION_TYPE_LABELS[s.type], html: s.html })) },
];

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function extractTitle(html: string): string {
  const heading = html.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  return stripTags(heading?.[1] ?? "") || "Section";
}

function inferSectionType(value: string): SectionType {
  const text = value.toLowerCase();
  if (text.includes("hero")) return "hero";
  if (text.includes("benefit")) return "benefits";
  if (text.includes("problem")) return "problem";
  if (text.includes("solution")) return "solution";
  if (text.includes("testimonial")) return "testimonials";
  if (text.includes("faq")) return "faq";
  if (text.includes("offer")) return "offer_stack";
  if (text.includes("guarantee")) return "guarantee";
  if (text.includes("closing")) return "closing_cta";
  if (text.includes("pricing")) return "pricing";
  if (text.includes("feature")) return "features";
  if (text.includes("countdown")) return "countdown";
  if (text.includes("lead")) return "lead_form";
  if (text.includes("about")) return "about";
  if (text.includes("comparison")) return "comparison";
  if (text.includes("bonus")) return "bonus";
  if (text.includes("cta")) return "cta";
  return "custom";
}

function extractSections(html: string): SectionBlock[] {
  const source = html.trim() || EMPTY_PAGE_HTML;
  const matches = [...source.matchAll(/<section[\s\S]*?<\/section>/gi)];
  const blocks = matches.length > 0 ? matches.map((m) => m[0]) : [source];
  return blocks.map((block, index) => {
    const idMatch = block.match(/id=["']?([^"'\s>]+)["']?/i);
    const inferred = inferSectionType(`${idMatch?.[1] ?? ""} ${block}`);
    const title = extractTitle(block);
    return {
      id: idMatch?.[1] ?? `${inferred}-${index + 1}`,
      title,
      type: inferred,
      roleLabel: SECTION_ROLE_LABELS[inferred],
      html: block,
      collapsed: false,
    };
  });
}

function composeHtml(sections: SectionBlock[]): string {
  if (sections.length === 0) return EMPTY_PAGE_HTML;
  return sections.map((section) => section.html.trim()).join("\n\n");
}

function ensureSectionWrapper(html: string, fallbackId: string): string {
  const trimmed = html.trim();
  if (/^<section[\s\S]*<\/section>$/i.test(trimmed)) return trimmed;
  return `<section id="${fallbackId}">${trimmed}</section>`;
}

function reorder<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) return items;
  const copy = [...items];
  const [moved] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, moved);
  return copy;
}

export function LandingPageEditorWorkspace({ page: initial }: Props) {
  const [page, setPage] = useState(initial);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [contentHtml, setContentHtml] = useState(initial.contentHtml || EMPTY_PAGE_HTML);
  const [contentVersion, setContentVersion] = useState("0");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [sectionLibrary, setSectionLibrary] = useState<SectionLibraryItem[]>(() => {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(SECTION_LIBRARY_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as SectionLibraryItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      window.localStorage.removeItem(SECTION_LIBRARY_KEY);
      return [];
    }
  });
  const [sections, setSections] = useState<SectionBlock[]>(() => extractSections(initial.contentHtml || EMPTY_PAGE_HTML));
  const [headerActionBusy, setHeaderActionBusy] = useState(false);
  useBreadcrumbTail(page.title);

  const syncSectionsToEditor = useCallback((nextSections: SectionBlock[]) => {
    const nextHtml = composeHtml(nextSections);
    setContentHtml(nextHtml);
    setContentVersion((v) => String(Number(v) + 1));
    editor?.commands.setContent(nextHtml, { emitUpdate: true });
  }, [editor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SECTION_LIBRARY_KEY, JSON.stringify(sectionLibrary));
  }, [sectionLibrary]);

  const patchPage = useCallback(async (patch: Record<string, unknown>) => {
    const response = await fetch(`/api/landing-pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!response.ok) return;
    const data = await response.json();
    setPage((prev) => ({ ...prev, ...data }));
  }, [page.id]);

  const runGenerate = useCallback(async () => {
    const response = await fetch(`/api/landing-pages/${page.id}/generate`, { method: "POST" });
    const data = await response.json();
    if (!response.ok || typeof data.contentHtml !== "string") return;
    const generatedSections = extractSections(data.contentHtml);
    setSections(generatedSections);
    syncSectionsToEditor(generatedSections);
    setPage((prev) => ({ ...prev, status: data.status ?? prev.status }));
  }, [page.id, syncSectionsToEditor]);

  const runAiTool = useCallback(async (tool: ToolAction, text: string): Promise<string | null> => {
    const response = await fetch("/api/landing-pages/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id, tool, text }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.result !== "string") return null;
    return data.result;
  }, [page.id]);

  const runSeoTool = useCallback(async (tool: "seo_title" | "seo_description" | "slug") => {
    const response = await fetch("/api/landing-pages/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId: page.id, tool, text: composeHtml(sections) }),
    });
    const data = await response.json();
    if (!response.ok || typeof data.result !== "string") return;
    if (tool === "seo_title") setPage((p) => ({ ...p, seoTitle: data.result }));
    if (tool === "seo_description") setPage((p) => ({ ...p, seoDescription: data.result }));
    if (tool === "slug") setPage((p) => ({ ...p, slug: data.result }));
  }, [page.id, sections]);

  const doExport = useCallback(async (kind: "html" | "markdown" | "tailwind") => {
    const route = kind === "tailwind" ? "export-tailwind" : `export-${kind}`;
    const response = await fetch(`/api/landing-pages/${page.id}/${route}`);
    const data = await response.json();
    if (!response.ok) return;
    const text = kind === "html" ? data.html : kind === "tailwind" ? data.tailwindHtml : data.markdown;
    await navigator.clipboard.writeText(text ?? "");
  }, [page.id]);

  const handleSave = useCallback(async () => {
    setHeaderActionBusy(true);
    await patchPage({ title: page.title, contentHtml: composeHtml(sections) });
    setHeaderActionBusy(false);
  }, [page.title, patchPage, sections]);

  const applySectionsUpdate = useCallback((updater: (prev: SectionBlock[]) => SectionBlock[]) => {
    setSections((prev) => {
      const next = updater(prev);
      syncSectionsToEditor(next);
      return next;
    });
  }, [syncSectionsToEditor]);

  const topLibrary = useMemo(
    () => [...sectionLibrary].sort((a, b) => Number(b.favorite) - Number(a.favorite)),
    [sectionLibrary],
  );

  return (
    <>
      <TrackNavRecent
        id={page.id}
        title={page.title}
        href={`/pages/${page.id}/editor`}
        kind="landing_page"
      />
      <ThreeColumnWorkspace
      className="min-h-[calc(100vh-4rem)]"
      header={
        <PageHeader
          eyebrow="Landing page builder"
          title={page.title}
          description="Visual conversion-page workspace with reusable sections and fast preview modes."
          className="border-0 pb-0"
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pages"><ArrowLeft className="size-4" aria-hidden />Pages</Link>
          </Button>
          <Button size="sm" onClick={() => void handleSave()} disabled={headerActionBusy}>
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMode("preview")}>
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => void doExport("html")}>
            Export
          </Button>
        </PageHeader>
      }
      left={
        leftCollapsed ? (
          <Button variant="outline" className="sticky top-3 w-full" onClick={() => setLeftCollapsed(false)}>Open brief panel</Button>
        ) : (
          <div className="sticky top-3 space-y-4">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setLeftCollapsed(true)}>Collapse brief panel</Button>
            <Card>
              <CardHeader><CardTitle className="text-base">Page details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input value={page.title} onChange={(e) => setPage((p) => ({ ...p, title: e.target.value }))} onBlur={() => void patchPage({ title: page.title })} placeholder="Title" />
                <Input value={page.slug ?? ""} onChange={(e) => setPage((p) => ({ ...p, slug: e.target.value }))} onBlur={() => void patchPage({ slug: page.slug })} placeholder="slug" />
                <Textarea value={page.targetAudience} onChange={(e) => setPage((p) => ({ ...p, targetAudience: e.target.value }))} onBlur={() => void patchPage({ targetAudience: page.targetAudience })} placeholder="Target audience" />
                <Textarea value={page.offer} onChange={(e) => setPage((p) => ({ ...p, offer: e.target.value }))} onBlur={() => void patchPage({ offer: page.offer })} placeholder="Offer" />
                <Input value={page.cta} onChange={(e) => setPage((p) => ({ ...p, cta: e.target.value }))} onBlur={() => void patchPage({ cta: page.cta })} placeholder="Primary CTA" />
                <Input value={page.tone} onChange={(e) => setPage((p) => ({ ...p, tone: e.target.value }))} onBlur={() => void patchPage({ tone: page.tone })} placeholder="Tone" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Template presets</CardTitle>
                <CardDescription>SaaS, ebook, lead magnet, webinar and more.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                {TEMPLATE_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const templateSections = preset.sections.map((section, index) => ({
                        id: `${section.type}-${index + 1}`,
                        title: section.title,
                        type: section.type,
                        roleLabel: SECTION_ROLE_LABELS[section.type],
                        html: section.html,
                        collapsed: false,
                      }));
                      setSections(templateSections);
                      syncSectionsToEditor(templateSections);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Quick add sections</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {QUICK_ADD_BLOCKS.map((block, index) => (
                  <Button
                    key={`${block.type}-${index}`}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() =>
                      applySectionsUpdate((prev) => [
                        ...prev,
                        {
                          id: `${block.type}-${prev.length + 1}`,
                          title: SECTION_TYPE_LABELS[block.type],
                          type: block.type,
                          roleLabel: SECTION_ROLE_LABELS[block.type],
                          html: block.html,
                          collapsed: false,
                        },
                      ])
                    }
                  >
                    <Plus className="size-4" aria-hidden />{block.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        )
      }
      center={
        <div className="space-y-3">
          <div className="sticky top-3 z-20 rounded-xl border border-border/70 bg-background/95 p-2 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant={mode === "edit" ? "default" : "outline"} onClick={() => setMode("edit")}>Edit</Button>
              <Button variant={mode === "preview" ? "default" : "outline"} onClick={() => setMode("preview")}><Eye className="size-4" aria-hidden />Preview</Button>
              <Button variant={device === "desktop" ? "secondary" : "outline"} onClick={() => setDevice("desktop")}><Monitor className="size-4" aria-hidden />Desktop</Button>
              <Button variant={device === "mobile" ? "secondary" : "outline"} onClick={() => setDevice("mobile")}><Smartphone className="size-4" aria-hidden />Mobile</Button>
              <Button variant="ghost" onClick={() => setShowRawEditor((v) => !v)}>{showRawEditor ? "Hide raw editor" : "Show raw editor"}</Button>
            </div>
          </div>
          <div className={device === "mobile" ? "mx-auto w-full max-w-[430px]" : "w-full"}>
            {mode === "edit" ? (
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <Card
                    key={`${section.id}-${index}`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragIndex === null) return;
                      applySectionsUpdate((prev) => reorder(prev, dragIndex, index));
                      setDragIndex(null);
                    }}
                    className="border border-border/70"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <GripVertical className="size-4 text-muted-foreground" aria-hidden />
                        <CardTitle className="text-base">{section.title || SECTION_TYPE_LABELS[section.type]}</CardTitle>
                        <Badge variant="secondary">{SECTION_TYPE_LABELS[section.type]}</Badge>
                        <Badge variant="outline">{section.roleLabel}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => applySectionsUpdate((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, collapsed: !item.collapsed } : item))}>
                          {section.collapsed ? "Expand" : "Collapse"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => applySectionsUpdate((prev) => reorder(prev, index, index - 1))} disabled={index === 0}><ArrowUp className="size-4" aria-hidden />Move up</Button>
                        <Button size="sm" variant="outline" onClick={() => applySectionsUpdate((prev) => reorder(prev, index, index + 1))} disabled={index === sections.length - 1}><ArrowDown className="size-4" aria-hidden />Move down</Button>
                        <Button size="sm" variant="outline" onClick={() => applySectionsUpdate((prev) => {
                          const copy = [...prev];
                          copy.splice(index + 1, 0, { ...prev[index], id: `${prev[index].type}-${Date.now()}` });
                          return copy;
                        })}>Duplicate</Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const item = sections[index];
                          setSectionLibrary((prev) => [
                            {
                              id: `lib-${Date.now()}`,
                              name: item.title || SECTION_TYPE_LABELS[item.type],
                              type: item.type,
                              html: item.html,
                              favorite: false,
                            },
                            ...prev,
                          ]);
                        }}>
                          <Star className="size-4" aria-hidden />Save to library
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => applySectionsUpdate((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4" aria-hidden />Delete</Button>
                      </div>
                      {!section.collapsed ? (
                        <>
                          <Input
                            value={section.title}
                            onChange={(e) => applySectionsUpdate((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))}
                            placeholder="Section title"
                          />
                          <Textarea
                            rows={8}
                            value={section.html}
                            onChange={(e) => applySectionsUpdate((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, html: ensureSectionWrapper(e.target.value, item.id) } : item))}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={savingSectionId === section.id}
                              onClick={async () => {
                                setSavingSectionId(section.id);
                                const rewritten = await runAiTool("make_more_persuasive", section.html);
                                if (rewritten) {
                                  applySectionsUpdate((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, html: ensureSectionWrapper(rewritten, item.id), title: extractTitle(rewritten) } : item));
                                }
                                setSavingSectionId(null);
                              }}
                            >
                              <Sparkles className="size-4" aria-hidden />Regenerate section
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(section.html)}><Copy className="size-4" aria-hidden />Copy section</Button>
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
                {showRawEditor ? (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Raw HTML editor</CardTitle></CardHeader>
                    <CardContent>
                      <LandingPageTipTapEditor
                        pageId={page.id}
                        initialHtml={contentHtml}
                        contentVersion={contentVersion}
                        onEditorReady={setEditor}
                        onSaved={(next) => {
                          setContentHtml(next);
                          setSections(extractSections(next));
                        }}
                      />
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : (
              <div className="min-h-[420px] rounded-2xl border border-border/70 bg-card p-6">
                <div className="prose prose-neutral max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: composeHtml(sections) }} />
              </div>
            )}
          </div>
        </div>
      }
      right={
        rightCollapsed ? (
          <Button variant="outline" className="sticky top-3 w-full" onClick={() => setRightCollapsed(false)}>Open tools panel</Button>
        ) : (
          <div className="sticky top-3 space-y-4">
            <Button variant="ghost" className="w-full justify-start" onClick={() => setRightCollapsed(true)}>Collapse tools panel</Button>
            <Card>
              <CardHeader><CardTitle className="text-base">AI generation</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" onClick={() => void runGenerate()}>Generate full landing page</Button>
                <Button variant="outline" className="w-full" onClick={async () => {
                  const rewritten = await runAiTool("improve_headline", composeHtml(sections));
                  if (rewritten) {
                    const next = extractSections(rewritten);
                    setSections(next);
                    syncSectionsToEditor(next);
                  }
                }}>Improve headline</Button>
                <Button variant="outline" className="w-full" onClick={async () => {
                  const rewritten = await runAiTool("increase_urgency", composeHtml(sections));
                  if (rewritten) {
                    const next = extractSections(rewritten);
                    setSections(next);
                    syncSectionsToEditor(next);
                  }
                }}>Increase urgency</Button>
                <Button variant="outline" className="w-full" onClick={async () => {
                  const rewritten = await runAiTool("add_emotional_triggers", composeHtml(sections));
                  if (rewritten) {
                    const next = extractSections(rewritten);
                    setSections(next);
                    syncSectionsToEditor(next);
                  }
                }}>Add emotional triggers</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reusable sections</CardTitle>
                <CardDescription>Save, favorite, and reuse your best conversion blocks.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {topLibrary.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved sections yet.</p>
                ) : topLibrary.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border/70 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{item.name}</p>
                      <Button size="icon" variant="ghost" onClick={() => setSectionLibrary((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, favorite: !entry.favorite } : entry))}>
                        <Star className={`size-4 ${item.favorite ? "fill-current text-yellow-500" : ""}`} aria-hidden />
                      </Button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => applySectionsUpdate((prev) => [...prev, {
                        id: `${item.type}-${Date.now()}`,
                        title: item.name,
                        type: item.type,
                        roleLabel: SECTION_ROLE_LABELS[item.type],
                        html: item.html,
                        collapsed: false,
                      }])}>
                        Reuse
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setSectionLibrary((prev) => prev.filter((entry) => entry.id !== item.id))}>Remove</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">SEO & export</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Input value={page.seoTitle ?? ""} onChange={(e) => setPage((p) => ({ ...p, seoTitle: e.target.value }))} onBlur={() => void patchPage({ seoTitle: page.seoTitle })} placeholder="SEO title" />
                <Textarea value={page.seoDescription ?? ""} onChange={(e) => setPage((p) => ({ ...p, seoDescription: e.target.value }))} onBlur={() => void patchPage({ seoDescription: page.seoDescription })} placeholder="Meta description" />
                <Input value={page.keywordTargeting ?? ""} onChange={(e) => setPage((p) => ({ ...p, keywordTargeting: e.target.value }))} onBlur={() => void patchPage({ keywordTargeting: page.keywordTargeting })} placeholder="Keyword targeting" />
                <div className="grid grid-cols-1 gap-2">
                  <Button variant="outline" onClick={() => void runSeoTool("seo_title")}>Generate SEO title</Button>
                  <Button variant="outline" onClick={() => void runSeoTool("seo_description")}>Generate meta description</Button>
                  <Button variant="outline" onClick={() => void runSeoTool("slug")}>Generate slug</Button>
                  <Button variant="outline" onClick={() => void doExport("html")}>Copy clean HTML export</Button>
                  <Button variant="outline" onClick={() => void doExport("tailwind")}>Copy Tailwind export</Button>
                  <Button variant="outline" onClick={() => void doExport("markdown")}>Copy Markdown export</Button>
                  <Button disabled variant="outline">React component export (later)</Button>
                  <Button disabled variant="outline">WordPress block export (later)</Button>
                  <Button onClick={() => void navigator.clipboard.writeText(composeHtml(sections))}><Copy className="size-4" aria-hidden />Copy workspace HTML</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }
    />
    </>
  );
}
