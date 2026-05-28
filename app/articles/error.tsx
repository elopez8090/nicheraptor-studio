"use client";

import { useEffect } from "react";

import { RouteErrorFallback } from "@/components/layout/route-error-fallback";

type ArticleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ArticleErrorPage({ error, reset }: ArticleErrorPageProps) {
  useEffect(() => {
    console.error("Article route error", error);
  }, [error]);

  return (
    <RouteErrorFallback
      title="Article screen unavailable"
      description="This article route failed unexpectedly. Retry now to recover."
      onRetry={reset}
    />
  );
}
