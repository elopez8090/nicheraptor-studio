import { NextResponse } from "next/server";

import { fetchContentLibraryTags } from "@/lib/content-library/fetch-content-library";

export async function GET() {
  const tags = await fetchContentLibraryTags();
  return NextResponse.json({ tags });
}
