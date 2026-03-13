import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({
      user_id: userId,
      onboarding_complete: false,
    });
  }

  // Also fetch brand image if onboarding is complete
  let brandImage = null;
  if (profile.onboarding_complete) {
    const { data } = await getSupabaseAdmin()
      .from("brand_images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    brandImage = data;
  }

  return NextResponse.json({ ...profile, brandImage });
}
