import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const count = Math.min(4, Math.max(1, Number(body.count) || 3));

  // Fetch user's latest brand image
  const { data: brandImage } = await getSupabaseAdmin()
    .from("brand_images")
    .select("full_brand_image")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!brandImage?.full_brand_image) {
    return Response.json(
      { error: "No brand image found. Complete onboarding first." },
      { status: 400 },
    );
  }

  const bi = brandImage.full_brand_image;

  const result = streamText({
    model: openrouter("google/gemini-2.5-flash"),
    prompt: `You are a UGC video script writer. Based on the following brand image, generate exactly ${count} unique UGC (User Generated Content) video script${count !== 1 ? "s" : ""}. Each script should be for a 20-30 second video.

BRAND IMAGE:
Brand: ${bi.brand_name}
Voice: ${bi.brand_voice}
Target Audience: ${bi.target_audience}
Content Style: ${bi.content_style}
Content Themes: ${bi.content_themes?.join(", ")}
UGC Suggestions: ${bi.ugc_suggestions?.join(", ")}

CRITICAL FORMAT RULES:
- You MUST separate each script with exactly this delimiter on its own line: ===SCRIPT_BREAK===
- Start each script with a markdown heading: # Script Title
- Include scene directions in **bold**
- Include spoken dialogue in regular text
- Include timing cues like [0:00-0:05] for each section
- Keep each script between 20-30 seconds when spoken aloud
- Make each script distinct in style/approach (e.g. testimonial, tutorial, day-in-the-life, unboxing)
- Make them feel authentic and natural, not overly polished
- Do NOT wrap scripts in code blocks or JSON
- Output ${count} scripts separated by ===SCRIPT_BREAK===
- Do NOT put ===SCRIPT_BREAK=== before the first script or after the last script`,
  });

  return result.toTextStreamResponse();
}
