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
  const supabase = getSupabaseAdmin();

  // Verify script belongs to user
  const { data: script } = await supabase
    .from("scripts")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!script) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  const { data: versions, error } = await supabase
    .from("script_versions")
    .select("id, version_number, content, created_at")
    .eq("script_id", id)
    .order("version_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: versions || [] });
}

// Revert to a specific version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { version_id } = await req.json();
  const supabase = getSupabaseAdmin();

  // Get the version content
  const { data: version } = await supabase
    .from("script_versions")
    .select("content")
    .eq("id", version_id)
    .eq("script_id", id)
    .single();

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Save current content as a new version before reverting
  const { data: current } = await supabase
    .from("scripts")
    .select("content")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (current) {
    const { data: latestVersion } = await supabase
      .from("script_versions")
      .select("version_number")
      .eq("script_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    await supabase.from("script_versions").insert({
      script_id: id,
      content: current.content,
      version_number: (latestVersion?.version_number || 0) + 1,
    });
  }

  // Update the script with the reverted content
  const { data, error } = await supabase
    .from("scripts")
    .update({ content: version.content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, content, created_at, updated_at, ready_to_localize")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
