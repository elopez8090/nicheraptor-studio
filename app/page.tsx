import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingShell } from "@/components/layout/marketing-shell";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
        <p className="mb-5 text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Digital product studio
        </p>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.08]">
          Create premium ebooks with AI
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
          NicheRaptor Studio helps you outline, write, and export professional
          digital products — without starting from a blank page.
        </p>
        <div className="mt-12 flex w-full max-w-md flex-col gap-3 sm:mx-auto sm:max-w-none sm:flex-row sm:justify-center">
          <Button size="xl" className="w-full sm:w-auto" asChild>
            <Link href="/ebooks/new">
              Start new ebook
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="xl" className="w-full sm:w-auto" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
        <p className="mt-16 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Outline generation, chapter-by-chapter AI writing, and export to PDF, DOCX,
          or Markdown — in one focused workspace.
        </p>
      </main>
    </MarketingShell>
  );
}
