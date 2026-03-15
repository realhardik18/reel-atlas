import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const MARKET_LOCALE_MAP: Record<string, string> = {
  IN: "hi",
  US: "en",
  BR: "pt-BR",
  ID: "id",
  MX: "es-MX",
  VN: "vi",
  RU: "ru",
  TR: "tr",
  JP: "ja",
  UK: "en-GB",
  DE: "de",
  KR: "ko",
  FR: "fr",
  CA: "en-CA",
  AU: "en-AU",
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scriptId = req.nextUrl.searchParams.get("scriptId");
  if (!scriptId) {
    return NextResponse.json({ error: "scriptId is required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("localized_scripts")
    .select("*")
    .eq("script_id", scriptId)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ localizations: data });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scriptId, targetMarkets } = await req.json();

  if (!scriptId || !targetMarkets?.length) {
    return NextResponse.json(
      { error: "scriptId and targetMarkets are required" },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();

  // Fetch script
  const { data: script, error: scriptErr } = await supabase
    .from("scripts")
    .select("id, content, user_id")
    .eq("id", scriptId)
    .eq("user_id", userId)
    .single();

  if (scriptErr || !script) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  // Fetch brand image for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("brand_image")
    .eq("user_id", userId)
    .single();

  const brandImage = profile?.brand_image?.full_brand_image;

  const apiKey = process.env.LINGO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Localization API key not configured" }, { status: 500 });
  }

  // Localize each market in parallel
  const results: Record<string, { locale: string; content: string; success: boolean; error?: string }> = {};

  const promises = targetMarkets.map(async (market: string) => {
    const locale = MARKET_LOCALE_MAP[market];
    if (!locale) {
      results[market] = { locale: "", content: "", success: false, error: "Unknown market" };
      return;
    }

    // Build brand context string
    let brandContext = "";
    if (brandImage) {
      const culturalNote = brandImage.cultural_notes?.[market] || "";
      brandContext = `Brand: ${brandImage.brand_name || ""}. Voice: ${brandImage.brand_voice || ""}. Cultural notes for ${market}: ${culturalNote}. Adapt tone and cultural references.`;
    }

    try {
      const res = await fetch("https://api.lingo.dev/process/localize", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceLocale: "en",
          targetLocale: locale,
          data: {
            _brand_context: brandContext,
            script_content: script.content,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        results[market] = { locale, content: "", success: false, error: errText };
        return;
      }

      const data = await res.json();
      const localizedContent = data.data?.script_content || data.script_content || "";

      results[market] = { locale, content: localizedContent, success: true };

      // Upsert into database
      await supabase.from("localized_scripts").upsert(
        {
          script_id: scriptId,
          user_id: userId,
          locale,
          market_code: market,
          content: localizedContent,
          created_at: new Date().toISOString(),
        },
        { onConflict: "script_id,locale" },
      );
    } catch (err) {
      results[market] = {
        locale,
        content: "",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });

  await Promise.allSettled(promises);

  return NextResponse.json({ results });
}
