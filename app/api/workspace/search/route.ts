import { NextResponse } from "next/server";

import { searchWorkspace } from "@/lib/workspace/workspace-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchWorkspace(q);
  return NextResponse.json({ results });
}
