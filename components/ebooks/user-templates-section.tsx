"use client";

import { useRouter } from "next/navigation";

import { UserEbookTemplateCard } from "@/components/ebooks/user-ebook-template-card";
import type { UserEbookTemplate } from "@/lib/ebooks/fetch-user-templates";
import { cn } from "@/lib/utils";

type UserTemplatesSectionProps = {
  initialTemplates: UserEbookTemplate[];
  embedded?: boolean;
};

export function UserTemplatesSection({
  initialTemplates,
  embedded = false,
}: UserTemplatesSectionProps) {
  const router = useRouter();

  if (initialTemplates.length === 0) {
    return (
      <section
        className={
          embedded
            ? "rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-8 text-center ring-1 ring-border/40"
            : "mt-10 rounded-xl border border-dashed bg-muted/30 px-6 py-8 text-center"
        }
      >
        <h2 className="text-lg font-semibold">Your personal templates</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Save any project outline from the dashboard menu to reuse it here.
        </p>
      </section>
    );
  }

  return (
    <section className={embedded ? undefined : "mt-10"}>
      {!embedded ? (
        <h2 className="text-lg font-semibold tracking-tight">Your personal templates</h2>
      ) : null}
      <ul className={cn("grid gap-6 sm:grid-cols-2 xl:grid-cols-3", embedded ? undefined : "mt-6")}>
        {initialTemplates.map((template) => (
          <li key={template.id}>
            <UserEbookTemplateCard
              template={template}
              onUpdated={() => router.refresh()}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
