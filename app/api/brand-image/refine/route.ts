import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { prompt, currentBrandImage } = await req.json();

  if (!prompt || !currentBrandImage) {
    return NextResponse.json({ error: "Prompt and current brand image are required" }, { status: 400 });
  }

  // Build dynamic schema from existing cultural_notes keys
  const markets: string[] = currentBrandImage.target_markets ??
    Object.keys(currentBrandImage.cultural_notes ?? {});

  const culturalNotesShape: Record<string, z.ZodString> = {};
  for (const m of markets) {
    culturalNotesShape[m] = z.string().describe(`Cultural adaptation notes for the ${m} market`);
  }

  const brandImageSchema = z.object({
    brand_name: z.string().describe("The brand name"),
    brand_voice: z.string().describe("Description of the brand voice and tone"),
    target_audience: z.string().describe("Description of the target audience"),
    content_style: z.string().describe("Recommended content style for social media"),
    content_themes: z.array(z.string()).describe("5-7 key content themes/pillars"),
    cultural_notes: z.object(culturalNotesShape).describe("Cultural adaptation notes per market"),
    ugc_suggestions: z.array(z.string()).describe("5 UGC content ideas tailored to the brand"),
    target_markets: z.array(z.string()).describe("The target markets"),
  });

  const { object: refined } = await generateObject({
    model: openrouter("google/gemini-2.5-flash"),
    schema: brandImageSchema,
    prompt: `You are a brand strategist. The user has an existing brand image and wants to refine it based on their feedback.

CURRENT BRAND IMAGE:
${JSON.stringify(currentBrandImage, null, 2)}

USER'S REFINEMENT REQUEST:
"${prompt}"

Update the brand image based on the user's request. Only change what they asked for — keep everything else the same. Return the complete updated brand image. Keep target_markets as ${JSON.stringify(markets)}.`,
  });

  const { data: existing } = await getSupabaseAdmin()
    .from("brand_images")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    await getSupabaseAdmin()
      .from("brand_images")
      .update({
        brand_name: refined.brand_name,
        brand_voice: refined.brand_voice,
        target_audience: refined.target_audience,
        content_style: refined.content_style,
        full_brand_image: refined,
      })
      .eq("id", existing.id);
  }

  return NextResponse.json(refined);
}
