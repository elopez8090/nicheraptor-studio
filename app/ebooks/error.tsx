"use client";

import { useEffect } from "react";

import { RouteErrorFallback } from "@/components/layout/route-error-fallback";

type EbookErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function EbookErrorPage({ error, reset }: EbookErrorPageProps) {
  useEffect(() => {
    console.error("Ebook route error", error);
  }, [error]);

  return (
    <RouteErrorFallback
      title="Ebook screen unavailable"
      description="The ebook route hit an error. Retry to recover your workspace."
      onRetry={reset}
    />
  );
}
