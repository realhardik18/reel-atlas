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

  const { scrapedData, answers, brandUrl, targetMarkets } = await req.json();

  const markets: string[] = targetMarkets ?? ["US", "UK", "AU", "IN"];

  // Build dynamic schema based on selected markets
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
    cultural_notes: z.object(culturalNotesShape).describe("Cultural adaptation notes per selected market"),
    ugc_suggestions: z.array(z.string()).describe("5 UGC content ideas tailored to the brand"),
    target_markets: z.array(z.string()).describe("The target markets selected by the user"),
  });

  const answersText = answers
    .map((a: { question: string; answer: string }) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");

  const { object: brandImage } = await generateObject({
    model: openrouter("google/gemini-2.5-flash"),
    schema: brandImageSchema,
    prompt: `You are a brand strategist. Based on the following scraped website data and the brand owner's answers to personalization questions, create a comprehensive brand image profile.

SCRAPED WEBSITE DATA:
Title: ${scrapedData.title}
Description: ${scrapedData.description}
Content: ${scrapedData.content?.slice(0, 3000)}

BRAND OWNER'S ANSWERS:
${answersText}

TARGET MARKETS: ${markets.join(", ")}

Generate a detailed brand image. Include cultural adaptation notes ONLY for these specific markets: ${markets.join(", ")}. Set target_markets to ${JSON.stringify(markets)}.`,
  });

  // Store in Supabase
  await getSupabaseAdmin().from("brand_images").insert({
    user_id: userId,
    brand_url: brandUrl,
    brand_name: brandImage.brand_name,
    brand_voice: brandImage.brand_voice,
    target_audience: brandImage.target_audience,
    content_style: brandImage.content_style,
    full_brand_image: brandImage,
  });

  // Mark onboarding as complete
  await getSupabaseAdmin()
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("user_id", userId);

  return NextResponse.json(brandImage);
}
