import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scripts")
    .select("id, title, content, created_at, updated_at, ready_to_localize")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch localized market codes for all scripts
  const scriptIds = (data || []).map((s) => s.id);
  const { data: localizations } = scriptIds.length > 0
    ? await supabase
        .from("localized_scripts")
        .select("script_id, market_code")
        .eq("user_id", userId)
        .in("script_id", scriptIds)
    : { data: [] };

  // Group market codes by script_id
  const locMap: Record<string, string[]> = {};
  for (const loc of localizations || []) {
    if (!locMap[loc.script_id]) locMap[loc.script_id] = [];
    locMap[loc.script_id].push(loc.market_code);
  }

  const scripts = (data || []).map((s) => ({
    ...s,
    localized_markets: locMap[s.id] || [],
  }));

  return NextResponse.json({ scripts });
}
