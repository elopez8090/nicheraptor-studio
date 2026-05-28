"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutTemplate, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createEbookFromTemplate } from "@/lib/ebooks/create-ebook-from-template";
import type { EbookTemplate } from "@/lib/ebooks/templates";

type EbookTemplateCardProps = {
  template: EbookTemplate;
};

export function EbookTemplateCard({ template }: EbookTemplateCardProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleUseTemplate() {
    setError(null);
    setIsCreating(true);

    try {
      const result = await createEbookFromTemplate(template.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      router.refresh();
      router.push(`/ebooks/${result.projectId}/editor`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card className="flex h-full flex-col shadow-premium transition-shadow hover:shadow-premium-lg">
      <CardHeader className="gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <LayoutTemplate className="size-5" aria-hidden />
        </div>
        <CardTitle className="text-xl leading-snug">{template.name}</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          <span className="font-medium text-foreground">Best for: </span>
          {template.bestUseCase}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <p className="text-sm font-medium text-foreground">Sample chapter structure</p>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          {template.chapters.map((chapter, index) => (
            <li key={chapter.title} className="flex gap-2">
              <span className="shrink-0 font-medium text-foreground/80">
                {index + 1}.
              </span>
              <span>{chapter.title}</span>
            </li>
          ))}
        </ol>
        {error ? (
          <p
            className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="border-t bg-muted/30">
        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={handleUseTemplate}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Creating project…
            </>
          ) : (
            "Use Template"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
