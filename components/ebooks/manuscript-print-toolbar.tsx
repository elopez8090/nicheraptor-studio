"use client";

import { useCallback } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ManuscriptPrintToolbar() {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <Button type="button" size="sm" className="gap-2" onClick={handlePrint}>
      <Printer className="size-4" aria-hidden />
      Print / Save as PDF
    </Button>
  );
}
