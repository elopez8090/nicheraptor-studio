import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyLandingPageAccess } from "@/lib/landing-pages/verify-landing-page-access";

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "");
}

function wrapInTailwindScaffold(content: string): string {
  return [
    `<main class="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">`,
    `  <div class="prose prose-neutral mx-auto max-w-none">`,
    `    ${content}`,
    "  </div>",
    "</main>",
  ].join("\n");
}

export async function GET(_request: Request, context: RouteContext) {
  const { pageId } = await context.params;
  if (!pageId?.trim()) {
    return NextResponse.json({ error: "Page id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyLandingPageAccess(supabase, pageId);
  if (!access.ok) {
    return NextResponse.json(
      { error: access.status === 401 ? "Unauthorized." : "Landing page not found." },
      { status: access.status },
    );
  }

  const { data, error } = await supabase
    .from("landing_pages")
    .select("title, content_html")
    .eq("id", pageId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Landing page not found." }, { status: 404 });
  }

  const cleanHtml = sanitizeHtml(data.content_html ?? "");
  return NextResponse.json({
    filename: `${(data.title || "landing-page").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.tailwind.html`,
    tailwindHtml: wrapInTailwindScaffold(cleanHtml),
  });
}
