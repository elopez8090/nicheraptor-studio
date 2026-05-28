"use client";

import { useEffect } from "react";

/** Wires bottom print button and optional ?print=1 auto-open. */
export function ManuscriptPrintPageClient() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("print") === "1") {
      const timer = window.setTimeout(() => window.print(), 400);
      return () => window.clearTimeout(timer);
    }
  }, []);

  return null;
}
