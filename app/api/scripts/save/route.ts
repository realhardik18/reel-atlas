import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content } = await req.json();

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("scripts")
    .insert({ user_id: userId, title, content })
    .select("id, title, content, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Save initial version (v1) so version history always has a baseline
  await supabase.from("script_versions").insert({
    script_id: data.id,
    version_number: 1,
    content,
  });

  // Default market: USA (en) — script is originally written in English
  await supabase.from("localized_scripts").upsert(
    {
      script_id: data.id,
      user_id: userId,
      locale: "en",
      market_code: "US",
      content,
      back_translation: content,
      created_at: new Date().toISOString(),
    },
    { onConflict: "script_id,locale" },
  );

  return NextResponse.json(data);
}
