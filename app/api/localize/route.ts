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
  const { data: brandImageRow } = await supabase
    .from("brand_images")
    .select("full_brand_image")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const brandImage = brandImageRow?.full_brand_image;

  const apiKey = process.env.LINGO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Localization API key not configured" }, { status: 500 });
  }

  // Localize each market in parallel
  const results: Record<string, { locale: string; content: string; backTranslation: string; success: boolean; error?: string }> = {};

  const promises = targetMarkets.map(async (market: string) => {
    const locale = MARKET_LOCALE_MAP[market];
    if (!locale) {
      results[market] = { locale: "", content: "", backTranslation: "", success: false, error: "Unknown market" };
      return;
    }

    // Build cultural adaptation context
    const countryLabel = { IN: "India", US: "United States", BR: "Brazil", ID: "Indonesia", MX: "Mexico", VN: "Vietnam", RU: "Russia", TR: "Turkey", JP: "Japan", UK: "United Kingdom", DE: "Germany", KR: "South Korea", FR: "France", CA: "Canada", AU: "Australia" }[market] || market;

    let adaptationContext = `The original script is written for the United States market in American English. This is NOT a word-for-word translation. This is a full cultural localization from the United States to ${countryLabel}. You MUST:\n`;
    adaptationContext += `- Replace idioms, metaphors, and sayings with culturally equivalent ones from ${countryLabel}\n`;
    adaptationContext += `- Swap cultural references (celebrities, holidays, food, sports, memes) with locally relevant ones\n`;
    adaptationContext += `- Adapt humor, tone, and slang to what resonates with ${countryLabel} audiences\n`;
    adaptationContext += `- Change CTAs, hooks, and engagement patterns to match local social media culture\n`;
    adaptationContext += `- Adjust formality level to what's natural for ${countryLabel} content creators\n`;
    adaptationContext += `- Replace any region-specific examples (prices, locations, brands) with local equivalents\n`;

    if (brandImage) {
      const culturalNote = brandImage.cultural_notes?.[market] || "";
      adaptationContext += `\nBrand: ${brandImage.brand_name || ""}. Voice: ${brandImage.brand_voice || ""}.`;
      if (culturalNote) adaptationContext += ` Specific notes for ${countryLabel}: ${culturalNote}.`;
    }

    try {
      // Step 1: Culturally adapt en → target
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
            _instructions: adaptationContext,
            script_content: script.content,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        results[market] = { locale, content: "", backTranslation: "", success: false, error: errText };
        return;
      }

      const data = await res.json();
      const localizedContent = data.data?.script_content || data.script_content || "";

      // Step 2: Literal back-translate target → en (word-for-word so user can see cultural changes)
      let backTranslation = "";
      try {
        const btRes = await fetch("https://api.lingo.dev/process/localize", {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceLocale: locale,
            targetLocale: "en",
            data: {
              _instructions: `Translate this LITERALLY back to English, word-for-word. Do NOT re-adapt or improve. Keep every cultural reference, idiom, and expression exactly as-is but in English.

IMPORTANT: Whenever the localized version differs from a simple translation (cultural adaptations, swapped references, changed idioms, adjusted CTAs, etc.), annotate the change inline using this exact format:
  adapted phrase ()[reason for the change]

Examples:
- "Champions League final ()[replaced 'Super Bowl' — football is the dominant sport in this market]"
- "WhatsApp us ()[replaced 'DM us' — WhatsApp is the primary messaging platform here]"
- "like a Bollywood blockbuster ()[replaced 'like a Hollywood hit' — local film industry reference]"
- "grab your chai ()[replaced 'grab your coffee' — chai is the cultural default drink]"

Rules for annotations:
- Only annotate parts that were culturally changed, NOT every word
- Keep the () empty — put the reason inside []
- Be specific about what was replaced and why
- Do NOT add annotations to parts that are just normal translation`,
              script_content: localizedContent,
            },
          }),
        });
        if (btRes.ok) {
          const btData = await btRes.json();
          backTranslation = btData.data?.script_content || btData.script_content || "";
        }
      } catch {
        // Back-translation is best-effort
      }

      results[market] = { locale, content: localizedContent, backTranslation, success: true };

      // Upsert into database
      await supabase.from("localized_scripts").upsert(
        {
          script_id: scriptId,
          user_id: userId,
          locale,
          market_code: market,
          content: localizedContent,
          back_translation: backTranslation,
          created_at: new Date().toISOString(),
        },
        { onConflict: "script_id,locale" },
      );
    } catch (err) {
      results[market] = {
        locale,
        content: "",
        backTranslation: "",
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  });

  await Promise.allSettled(promises);

  return NextResponse.json({ results });
}
