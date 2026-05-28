"use client";

import { useEffect } from "react";

import { RouteErrorFallback } from "@/components/layout/route-error-fallback";

type StudioErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudioErrorPage({ error, reset }: StudioErrorPageProps) {
  useEffect(() => {
    console.error("Studio route error", error);
  }, [error]);

  return (
    <RouteErrorFallback
      title="Workspace failed to load"
      description="A workspace error occurred. Retry this route or return to dashboard."
      onRetry={reset}
    />
  );
}
