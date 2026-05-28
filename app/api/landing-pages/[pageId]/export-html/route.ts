import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyLandingPageAccess } from "@/lib/landing-pages/verify-landing-page-access";

type RouteContext = {
  params: Promise<{ pageId: string }>;
};

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

  return NextResponse.json({
    filename: `${(data.title || "landing-page").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.html`,
    html: data.content_html ?? "",
  });
}
