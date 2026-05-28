import { Suspense } from "react";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { MarketingShell } from "@/components/layout/marketing-shell";

export const metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <MarketingShell>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 sm:py-24">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <AuthCard mode="register" />
        </Suspense>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground hover:underline">
            Back to home
          </Link>
        </p>
      </main>
    </MarketingShell>
  );
}
