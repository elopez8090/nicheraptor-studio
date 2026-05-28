"use client";

import { useEffect } from "react";

import { RouteErrorFallback } from "@/components/layout/route-error-fallback";

type GlobalErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled route error", error);
  }, [error]);

  return (
    <RouteErrorFallback
      title="Unexpected app error"
      description="An unexpected error interrupted this page. Retry now or go back to the dashboard."
      onRetry={reset}
    />
  );
}
