import { NextResponse } from "next/server";

import {
  isPlannerEntityKind,
  isPlannerRelationshipType,
} from "@/lib/planner/constants";
import { mapRelationshipRow } from "@/lib/planner/map-rows";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPlannerSnapshot();
  return NextResponse.json({ relationships: snapshot.relationships });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Record<string, unknown>;
  const fromKind = typeof body.fromKind === "string" ? body.fromKind : "";
  const toKind = typeof body.toKind === "string" ? body.toKind : "";
  const fromId = typeof body.fromId === "string" ? body.fromId : "";
  const toId = typeof body.toId === "string" ? body.toId : "";

  if (
    !isPlannerEntityKind(fromKind) ||
    !isPlannerEntityKind(toKind) ||
    !fromId ||
    !toId
  ) {
    return NextResponse.json(
      { error: "Valid fromKind, fromId, toKind, and toId are required." },
      { status: 400 },
    );
  }

  const relationshipTypeRaw =
    typeof body.relationshipType === "string"
      ? body.relationshipType
      : "related";
  const relationshipType = isPlannerRelationshipType(relationshipTypeRaw)
    ? relationshipTypeRaw
    : "related";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("content_relationships")
    .insert({
      from_kind: fromKind,
      from_id: fromId,
      to_kind: toKind,
      to_id: toId,
      relationship_type: relationshipType,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to create relationship." },
      { status: 500 },
    );
  }

  return NextResponse.json({ relationship: mapRelationshipRow(data) });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { error } = await supabase
    .from("content_relationships")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
