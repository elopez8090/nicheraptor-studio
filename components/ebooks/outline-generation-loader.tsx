"use client";

import { useEffect, useState } from "react";

import { FullEbookGenerationPanel } from "@/components/ebooks/full-ebook-generation-panel";
import type { GenerationChapterSnapshot } from "@/lib/ebooks/use-full-ebook-generation";

type OutlineGenerationLoaderProps = {
  projectId: string;
  ebookTitle: string;
  audience: string;
  goal: string;
};

export function OutlineGenerationLoader({
  projectId,
  ebookTitle,
  audience,
  goal,
}: OutlineGenerationLoaderProps) {
  const [chapters, setChapters] = useState<GenerationChapterSnapshot[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError(null);
      const res = await fetch(
        `/api/ebooks/${encodeURIComponent(projectId)}/generate-full`,
      );
      const data = (await res.json()) as {
        error?: string;
        chapters?: GenerationChapterSnapshot[];
      };

      if (cancelled) {
        return;
      }

      if (!res.ok) {
        setLoadError(data.error ?? "Could not load chapters for generation.");
        return;
      }

      if (Array.isArray(data.chapters)) {
        setChapters(data.chapters);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loadError) {
    return (
      <p className="mt-4 text-sm text-destructive" role="alert">
        {loadError}
      </p>
    );
  }

  if (chapters.length === 0) {
    return null;
  }

  return (
    <FullEbookGenerationPanel
      className="mt-6"
      projectId={projectId}
      ebookTitle={ebookTitle}
      audience={audience}
      goal={goal}
      chapters={chapters}
    />
  );
}
