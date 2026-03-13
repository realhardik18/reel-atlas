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

    // Generate personalization questions using Gemini
    const { object } = await generateObject({
      model: openrouter("google/gemini-3-flash-preview"),
      schema: z.object({
        questions: z
          .array(z.string())
          .length(5)
          .describe("5 personalization questions based on the brand website"),
      }),
      prompt: `You are a brand strategist onboarding a new client. Based on the following scraped website content, generate exactly 5 short, conversational personalization questions to better understand their brand goals and content needs. Questions should be specific to this brand, not generic.

Website title: ${scrapedData.title}
Website description: ${scrapedData.description}
Website content (first 3000 chars): ${scrapedData.content?.slice(0, 3000)}

Generate questions that cover: brand personality, target audience preferences, content goals, competitive positioning, and cultural/regional focus.`,
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
