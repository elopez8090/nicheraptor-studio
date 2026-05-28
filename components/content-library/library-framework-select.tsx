"use client";

import { useEffect, useState } from "react";

import type { ContentLibraryItem } from "@/lib/content-library/types";

type LibraryFrameworkSelectProps = {
  value: string | null;
  onChange: (frameworkId: string | null) => void;
  className?: string;
};

export function LibraryFrameworkSelect({
  value,
  onChange,
  className,
}: LibraryFrameworkSelectProps) {
  const [frameworks, setFrameworks] = useState<ContentLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/content-library?type=framework");
        const data = (await res.json()) as { items?: ContentLibraryItem[] };
        if (!cancelled && Array.isArray(data.items)) {
          setFrameworks(data.items);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={className}>
      <label htmlFor="library-framework" className="text-sm font-medium">
        Writing framework (library)
      </label>
      <select
        id="library-framework"
        className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
        value={value ?? ""}
        disabled={loading}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">None — default structure</option>
        {frameworks.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </select>
      <p className="mt-1 text-xs text-muted-foreground">
        Optional saved framework applied during chapter generation.
      </p>
    </div>
  );
}
