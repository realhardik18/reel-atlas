import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { market } = await req.json();
  if (!market) {
    return NextResponse.json({ error: "market is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify script ownership
  const { data: script, error: scriptErr } = await supabase
    .from("scripts")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (scriptErr || !script) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  // Find the localization for this market
  const { data: loc, error: locErr } = await supabase
    .from("localized_scripts")
    .select("id, share_token")
    .eq("script_id", id)
    .eq("market_code", market)
    .single();

  if (locErr || !loc) {
    return NextResponse.json({ error: "Localization not found" }, { status: 404 });
  }

  // Return existing token if already shared
  if (loc.share_token) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${loc.share_token}`;
    return NextResponse.json({ token: loc.share_token, url });
  }

  // Generate new share token
  const { data, error } = await supabase
    .from("localized_scripts")
    .update({ share_token: crypto.randomUUID() })
    .eq("id", loc.id)
    .select("share_token")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const url = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${data.share_token}`;
  return NextResponse.json({ token: data.share_token, url });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const market = req.nextUrl.searchParams.get("market");
  if (!market) {
    return NextResponse.json({ error: "market is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Verify script ownership
  const { data: script } = await supabase
    .from("scripts")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!script) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("localized_scripts")
    .update({ share_token: null })
    .eq("script_id", id)
    .eq("market_code", market);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
