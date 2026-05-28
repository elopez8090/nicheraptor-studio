"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LANDING_PAGE_TYPE_OPTIONS } from "@/lib/landing-pages/landing-page-constants";

export default function NewLandingPagePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [pageType, setPageType] = useState("lead_magnet_page");
  const [targetAudience, setTargetAudience] = useState("");
  const [offer, setOffer] = useState("");
  const [cta, setCta] = useState("");
  const [tone, setTone] = useState("Confident, clear, conversion-focused");
  const [keywordTargeting, setKeywordTargeting] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, pageType, targetAudience, offer, cta, tone, keywordTargeting }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data?.error === "string" ? data.error : "Could not create page.");
        return;
      }
      if (typeof data.pageId === "string") router.push(`/pages/${data.pageId}/editor`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer size="narrow">
      <PageHeader
        eyebrow="Landing pages"
        title="New landing page"
        description="Define your conversion brief and generate a complete sales page in the editor."
      />
      <Card className="mt-8 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-primary" aria-hidden />Page brief</CardTitle>
          <CardDescription>These fields guide AI conversion copy, section strategy, and SEO.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <Input placeholder="Page title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={pageType} onChange={(e) => setPageType(e.target.value)}>
              {LANDING_PAGE_TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <Textarea placeholder="Target audience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} rows={2} />
            <Textarea placeholder="Offer" value={offer} onChange={(e) => setOffer(e.target.value)} rows={2} />
            <Input placeholder="Primary CTA" value={cta} onChange={(e) => setCta(e.target.value)} />
            <Input placeholder="Tone" value={tone} onChange={(e) => setTone(e.target.value)} />
            <Input placeholder="Keyword targeting" value={keywordTargeting} onChange={(e) => setKeywordTargeting(e.target.value)} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Creating…" : "Create landing page & open editor"}</Button>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
