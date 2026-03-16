import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = getSupabaseAdmin();

  // Look up localization by share token — no auth required
  const { data: loc, error } = await supabase
    .from("localized_scripts")
    .select("script_id, market_code, locale, content")
    .eq("share_token", token)
    .single();

  if (error || !loc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch script title
  const { data: script } = await supabase
    .from("scripts")
    .select("title")
    .eq("id", loc.script_id)
    .single();

  return NextResponse.json({
    title: script?.title || "Untitled",
    market_code: loc.market_code,
    locale: loc.locale,
    content: loc.content,
  });
}
