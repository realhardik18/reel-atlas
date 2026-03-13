import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Firecrawl from "firecrawl";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

const firecrawl = new Firecrawl({
  apiKey: process.env.FIRECRAWL_API_KEY!,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const questionSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe("The question text"),
        options: z
          .array(z.string())
          .length(4)
          .describe("Exactly 4 answer options"),
      }),
    )
    .length(5)
    .describe("5 MCQ personalization questions"),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Ensure profile exists
    const { data: existingProfile } = await getSupabaseAdmin()
      .from("profiles")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (!existingProfile) {
      await getSupabaseAdmin().from("profiles").insert({ user_id: userId });
    }

    // Scrape the URL
    const result = await firecrawl.scrape(url);

    const scrapedData = {
      title: result.metadata?.title ?? null,
      description: result.metadata?.description ?? null,
      content: result.markdown ?? null,
      links: result.links ?? [],
      metadata: result.metadata ?? {},
    };

    // Generate personalization MCQs using Gemini
    const { object } = await generateObject({
      model: openrouter("google/gemini-2.5-flash"),
      schema: questionSchema,
      prompt: `You are a brand strategist building a localized brand image for a client. You need to understand their brand deeply so you can adapt their content for US, UK, Australia, and India markets.

Based on the scraped website below, generate exactly 5 multiple-choice questions (4 options each). These questions should help you understand:

1. BRAND TONE & PERSONALITY — How does the brand want to come across? (e.g., playful vs authoritative, casual vs premium). Use specifics from the website.
2. PRIMARY AUDIENCE — Who are they really targeting? Give options that reflect realistic audience segments based on what the site sells/offers.
3. CONTENT GOALS — What kind of social media content do they want? (e.g., educational tutorials, behind-the-scenes, customer stories, product showcases)
4. REGIONAL PRIORITY — Which market matters most right now, or how do they want to prioritize US/UK/AU/IN rollout?
5. CULTURAL ADAPTATION STYLE — How aggressively should content be localized? (e.g., same content everywhere, light regional tweaks, fully rebuilt per market, influencer-led per region)

Make the options specific to THIS brand — reference their actual products, services, or industry. Don't use generic filler options. Each option should be short (under 10 words) and clearly distinct.

WEBSITE DATA:
Title: ${scrapedData.title}
Description: ${scrapedData.description}
Content (first 3000 chars): ${scrapedData.content?.slice(0, 3000)}`,
    });

    return NextResponse.json({
      scrapedData,
      questions: object.questions,
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 },
    );
  }
}
