import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await getSupabaseAdmin()
    .from("scripts")
    .select("id, title, content, created_at, updated_at, ready_to_localize")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabaseAdmin();

  // If content is changing, save current content as a version first
  if (body.content !== undefined) {
    const { data: current } = await supabase
      .from("scripts")
      .select("content")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (current && current.content !== body.content) {
      // Get next version number
      const { data: latestVersion } = await supabase
        .from("script_versions")
        .select("version_number")
        .eq("script_id", id)
        .order("version_number", { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (latestVersion?.version_number || 0) + 1;

      await supabase.from("script_versions").insert({
        script_id: id,
        content: current.content,
        version_number: nextVersion,
      });
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.ready_to_localize !== undefined) updates.ready_to_localize = body.ready_to_localize;

  const { data, error } = await supabase
    .from("scripts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, content, created_at, updated_at, ready_to_localize")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from("scripts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
